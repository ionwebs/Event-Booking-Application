import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    collection,
    addDoc,
    getDocs,
    query,
    updateDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';
import { db } from '../../firebase-config';
import Navbar from '../Layout/Navbar';
import './CustomFields.css';

const CustomFieldsManagement = () => {
    const { currentUser } = useAuth();

    const [customFields, setCustomFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingField, setEditingField] = useState(null);

    // Form state
    const [fieldName, setFieldName] = useState('');
    const [fieldType, setFieldType] = useState('select'); // select, text, number
    const [options, setOptions] = useState(['']);
    const [showInListView, setShowInListView] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchCustomFields();
    }, []);

    const fetchCustomFields = async () => {
        try {
            const fieldsSnapshot = await getDocs(collection(db, 'customFields'));
            const fieldsData = fieldsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCustomFields(fieldsData);
        } catch (err) {
            console.error('Error fetching custom fields:', err);
            setError('Failed to load custom fields');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!fieldName.trim()) {
            setError('Field name is required');
            return;
        }

        if (fieldType === 'select' && options.filter(o => o.trim()).length === 0) {
            setError('At least one option is required for select fields');
            return;
        }

        try {
            const fieldData = {
                name: fieldName.trim(),
                type: fieldType,
                options: fieldType === 'select' ? options.filter(o => o.trim()) : [],
                showInListView: showInListView,
                createdBy: currentUser.uid,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            if (editingField) {
                await updateDoc(doc(db, 'customFields', editingField.id), fieldData);
                setSuccess('Custom field updated successfully!');
            } else {
                await addDoc(collection(db, 'customFields'), fieldData);
                setSuccess('Custom field created successfully!');
            }

            resetForm();
            fetchCustomFields();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving custom field:', err);
            setError('Failed to save custom field');
        }
    };

    const handleEdit = (field) => {
        setEditingField(field);
        setFieldName(field.name);
        setFieldType(field.type);
        setOptions(field.options.length > 0 ? field.options : ['']);
        setShowInListView(field.showInListView !== false); // Default to true if not set
        setShowCreateModal(true);
    };

    const handleDelete = async (fieldId) => {
        if (!window.confirm('Are you sure? This will remove this field from all bookings.')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'customFields', fieldId));
            setSuccess('Custom field deleted successfully!');
            fetchCustomFields();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting custom field:', err);
            setError('Failed to delete custom field');
        }
    };

    const resetForm = () => {
        setFieldName('');
        setFieldType('select');
        setOptions(['']);
        setShowInListView(true);
        setEditingField(null);
        setShowCreateModal(false);
    };

    const addOption = () => {
        setOptions([...options, '']);
    };

    const removeOption = (index) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const updateOption = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    return (
        <div className="custom-fields-page">
            <Navbar />

            <div className="custom-fields-container container">
                <div className="custom-fields-header">
                    <div>
                        <h1 className="custom-fields-title">Custom Fields</h1>
                        <p className="custom-fields-subtitle">Create custom fields to categorize your events</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create Field
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {success}
                    </div>
                )}

                {loading ? (
                    <div className="custom-fields-loading">
                        <span className="spinner"></span>
                        <p>Loading custom fields...</p>
                    </div>
                ) : customFields.length === 0 ? (
                    <div className="empty-state card">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="9" y1="9" x2="15" y2="9" />
                            <line x1="9" y1="15" x2="15" y2="15" />
                        </svg>
                        <h3>No custom fields yet</h3>
                        <p>Create custom fields to add more details to your events</p>
                        <button
                            className="btn btn-primary mt-md"
                            onClick={() => setShowCreateModal(true)}
                        >
                            Create Field
                        </button>
                    </div>
                ) : (
                    <div className="fields-grid">
                        {customFields.map(field => (
                            <div key={field.id} className="field-card card">
                                <div className="field-card-header">
                                    <h3 className="field-card-title">{field.name}</h3>
                                    <span className="badge badge-primary">{field.type}</span>
                                </div>

                                {field.type === 'select' && field.options.length > 0 && (
                                    <div className="field-card-options">
                                        <p className="field-options-label">Options:</p>
                                        <div className="field-options-list">
                                            {field.options.map((option, index) => (
                                                <span key={index} className="field-option-tag">
                                                    {option}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="field-card-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleEdit(field)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => handleDelete(field.id)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingField ? 'Edit Custom Field' : 'Create Custom Field'}
                            </h3>
                            <button className="modal-close" onClick={resetForm}>
                                <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">
                                    Field Name
                                    <span style={{ color: 'var(--color-error)' }}> *</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Event Type, Priority, Department"
                                    value={fieldName}
                                    onChange={(e) => setFieldName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Field Type</label>
                                <select
                                    className="form-select"
                                    value={fieldType}
                                    onChange={(e) => setFieldType(e.target.value)}
                                >
                                    <option value="select">Dropdown (Select)</option>
                                    <option value="text">Text Input</option>
                                    <option value="number">Number Input</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={showInListView}
                                        onChange={(e) => setShowInListView(e.target.checked)}
                                    />
                                    <span>Show in Calendar List View</span>
                                </label>
                                <small className="form-help">
                                    Display this field value on booking cards in the calendar
                                </small>
                            </div>

                            {fieldType === 'select' && (
                                <div className="form-group">
                                    <label className="form-label">Options</label>
                                    {options.map((option, index) => (
                                        <div key={index} className="option-input-group">
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder={`Option ${index + 1}`}
                                                value={option}
                                                onChange={(e) => updateOption(index, e.target.value)}
                                            />
                                            {options.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn-icon btn-icon-danger"
                                                    onClick={() => removeOption(index)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn btn-secondary mt-sm"
                                        onClick={addOption}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        Add Option
                                    </button>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingField ? 'Update Field' : 'Create Field'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomFieldsManagement;
