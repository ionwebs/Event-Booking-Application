import React, { useState } from 'react';

const TeamSelector = ({ teams, selectedTeam, onTeamChange, disabled = false }) => {
    return (
        <div className="form-group">
            <label className="form-label">
                Select Team
                <span style={{ color: 'var(--color-error)' }}> *</span>
            </label>
            <select
                className="form-select"
                value={selectedTeam}
                onChange={(e) => onTeamChange(e.target.value)}
                disabled={disabled}
                required
            >
                <option value="">Choose a team...</option>
                {teams.map(team => (
                    <option key={team.id} value={team.id}>
                        {team.name}
                    </option>
                ))}
            </select>
            {teams.length === 0 && (
                <p className="form-error">
                    No teams available. Please create a team first.
                </p>
            )}
        </div>
    );
};

export default TeamSelector;
