import React from 'react';
import './QuickQuestions.css';

const QuickQuestions = ({ handleQuestionClick }) => {
    return (
        <div className="quick-questions">
            <button className="question-button" onClick={() => handleQuestionClick("你好")}>
                你好
            </button>
            <button className="question-button" onClick={() => handleQuestionClick("告訴我台灣原住民的知識")}>
                告訴我台灣原住民的知識
            </button>
            <button className="question-button" onClick={() => handleQuestionClick("台灣原住民有幾族")}>
                台灣原住民有幾族
            </button>
        </div>
    );
};

export default QuickQuestions;
