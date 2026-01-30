import React, { useState, useEffect, useRef } from 'react';
import { parseVoiceCommand } from '../../utils/voiceParser';
import { getDictionary, defaultLanguage } from '../../utils/dictionaries';
import './VoiceManager.css';

const VoiceManager = ({ isOpen, onClose, onDataParsed, teams }) => {
    const [language, setLanguage] = useState(defaultLanguage);
    const [status, setStatus] = useState('IDLE'); // IDLE, LISTENING, PROCESSING, ASKING, FEEDBACK
    const [transcript, setTranscript] = useState('');
    const [systemMessage, setSystemMessage] = useState('');
    const [partialData, setPartialData] = useState({});

    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    useEffect(() => {
        if (isOpen) {
            startListening('COMMAND');
        } else {
            stopListening();
        }
        return () => stopListening();
    }, [isOpen]);

    const speak = (text) => {
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        // utterance.lang = language; // Set voice language if available
        synthRef.current.speak(utterance);
    };

    const startListening = (mode = 'COMMAND') => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSystemMessage('Speech API not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setStatus('LISTENING');
            setSystemMessage(getDictionary(language).prompts.listening);
        };

        recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            setTranscript(result);
            handleInput(result, mode);
        };

        recognition.onerror = (event) => {
            console.error('Speech error', event.error);
            setStatus('ERROR');
            setSystemMessage('Error: ' + event.error);
        };

        recognition.onend = () => {
            // parsing usually happens in onresult, but if silent we might need to reset
            if (status === 'LISTENING') {
                // setStatus('IDLE');
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setStatus('IDLE');
    };

    const handleInput = (text, mode) => {
        setStatus('PROCESSING');
        const dictionary = getDictionary(language);

        if (mode === 'COMMAND') {
            // Initial parsing
            const data = parseVoiceCommand(text, language, teams);
            setPartialData(data);

            // Check for missing required fields (Team is main one)
            if (!data.teamId && teams.length > 0) {
                // Ask for team
                const question = dictionary.prompts.ask_team;
                setSystemMessage(question);
                speak(question);

                // Wait for speech to finish then listen again
                setTimeout(() => {
                    startListening('ANSWER_TEAM');
                }, 2000);
            } else {
                // Done
                finalize(data);
            }
        } else if (mode === 'ANSWER_TEAM') {
            // Try to find team in this answer
            // We use the same parser but treat text as potential team name
            // Or just fuzzy match again
            let foundTeamId = null;
            const lowerText = text.toLowerCase();

            for (const team of teams) {
                if (lowerText.includes(team.name.toLowerCase())) {
                    foundTeamId = team.id;
                    break;
                }
            }

            if (foundTeamId) {
                const newData = { ...partialData, teamId: foundTeamId };
                finalize(newData);
            } else {
                setSystemMessage(dictionary.prompts.retry);
                speak(dictionary.prompts.retry);
                setTimeout(() => {
                    startListening('ANSWER_TEAM');
                }, 2000);
            }
        }
    };

    const finalize = (data) => {
        const dictionary = getDictionary(language);
        setStatus('SUCCESS');
        setSystemMessage(dictionary.prompts.success);
        speak(dictionary.prompts.success);

        onDataParsed(data);

        setTimeout(() => {
            onClose();
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="voice-overlay">
            <div className="voice-card">
                <button className="close-btn" onClick={onClose}>×</button>

                <div className={`voice-visualizer ${status.toLowerCase()}`}>
                    <div className="ripple"></div>
                    <div className="ripple delay-1"></div>
                    <span className="mic-icon">🎙️</span>
                </div>

                <div className="voice-content">
                    <h3>{systemMessage}</h3>
                    <p className="transcript">"{transcript}"</p>
                </div>

                <div className="language-selector">
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                        <option value="en-US">English</option>
                        <option value="gu-IN">Gujarati</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default VoiceManager;
