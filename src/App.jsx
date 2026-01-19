import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Dashboard from './components/Dashboard/Dashboard';
import TeamManagement from './components/Teams/TeamManagement';
import BookingCalendar from './components/Booking/BookingCalendar';
import BookingForm from './components/Booking/BookingForm';
import CustomFieldsManagement from './components/CustomFields/CustomFieldsManagement';
import UserManagement from './components/Admin/UserManagement';
import AwaitingApproval from './components/Auth/AwaitingApproval';
import './index.css';

function App() {
    return (
        <ErrorBoundary showError={import.meta.env.DEV}>
            <AuthProvider>
                <NotificationProvider>
                    <Router>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/teams"
                                element={
                                    <ProtectedRoute>
                                        <TeamManagement />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/calendar"
                                element={
                                    <ProtectedRoute>
                                        <BookingCalendar />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/booking/new"
                                element={
                                    <ProtectedRoute>
                                        <BookingForm />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/booking/edit/:id"
                                element={
                                    <ProtectedRoute>
                                        <BookingForm />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/custom-fields"
                                element={
                                    <ProtectedRoute>
                                        <CustomFieldsManagement />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/users"
                                element={
                                    <ProtectedRoute>
                                        <UserManagement />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/awaiting-approval"
                                element={
                                    <ProtectedRoute requireApproval={false}>
                                        <AwaitingApproval />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </Router>
                </NotificationProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
