import React, { useState, useEffect } from 'react';
import { FaAlignLeft, FaAlignCenter, FaAlignRight, FaSync } from 'react-icons/fa'; // Icons for alignment and rotation

const ComponentSettings = ({
    component, // Current selected component
    handleComponentSizeChange,
    handleComponentPositionChange,
    handleTextFontSizeChange,
    handleTextContentChange,
    handleTextFontChange,
    handleTextFontWeightChange,
    handleTextAlignmentChange,
    handleTextRotationChange,
    handleTextColorChange
}) => {
    const [enteredText, setEnteredText] = useState(component.content);
    const [widthCM, setWidthCM] = useState('');
    const [heightCM, setHeightCM] = useState('');
    const [topCM, setTopCM] = useState('');
    const [leftCM, setLeftCM] = useState('');
    const [textFontSize, setTextFontSize] = useState('');
    const [font, setFont] = useState('Arial');  // Default system font
    const [fontWeight, setFontWeight] = useState('normal');
    const [textAlign, setTextAlign] = useState('left');
    const [rotation, setRotation] = useState(0);
    const [fontColor, setFontColor] = useState('#000000');

    const CM_TO_PX = 37.795276;

    useEffect(() => {
        if (component) {
            setWidthCM((component.size?.width / CM_TO_PX).toString() || '');
            setHeightCM((component.size?.height / CM_TO_PX).toString() || '');
            setTopCM((component.position?.top / CM_TO_PX).toString() || '');
            setLeftCM((component.position?.left / CM_TO_PX).toString() || '');
            setTextFontSize(component.textFontSize || '');
            setFont(component.font || 'Arial');  // Set default font
            setFontWeight(component.fontWeight || 'normal');
            setTextAlign(component.textAlign || 'left');
            setRotation(component.rotation || 0);
            setFontColor(component.fontColor || '#000000');
            setEnteredText(component.content || '');
        }
    }, [component]);

    const handleTextChange = (e) => {
        const newText = e.target.value;
        setEnteredText(newText);
        handleTextContentChange(newText);
    };

    const handleWidthChange = (e) => {
        const newWidthCM = e.target.value;
        setWidthCM(newWidthCM);
        const newWidthPX = parseFloat(newWidthCM) * CM_TO_PX;
        if (!isNaN(newWidthPX)) {
            handleComponentSizeChange(component.id, { ...component.size, width: newWidthPX });
        }
    };

    const handleHeightChange = (e) => {
        const newHeightCM = e.target.value;
        setHeightCM(newHeightCM);
        const newHeightPX = parseFloat(newHeightCM) * CM_TO_PX;
        if (!isNaN(newHeightPX)) {
            handleComponentSizeChange(component.id, { ...component.size, height: newHeightPX });
        }
    };

    const handleTopChange = (e) => {
        const newTopCM = e.target.value;
        setTopCM(newTopCM);
        const newTopPX = parseFloat(newTopCM) * CM_TO_PX;
        if (!isNaN(newTopPX)) {
            handleComponentPositionChange(component.id, { ...component.position, top: newTopPX });
        }
    };

    const handleLeftChange = (e) => {
        const newLeftCM = e.target.value;
        setLeftCM(newLeftCM);
        const newLeftPX = parseFloat(newLeftCM) * CM_TO_PX;
        if (!isNaN(newLeftPX)) {
            handleComponentPositionChange(component.id, { ...component.position, left: newLeftPX });
        }
    };

    const handleTextFontSizeInputChange = (e) => {
        const newTextFontSize = e.target.value;
        setTextFontSize(newTextFontSize);
        const newTextFontSizeInt = parseInt(newTextFontSize);
        if (!isNaN(newTextFontSizeInt)) {
            handleTextFontSizeChange(component.id, newTextFontSizeInt);
        }
    };

    const handleFontChange = (e) => {
        const newFont = e.target.value;
        setFont(newFont);
        handleTextFontChange(component.id, newFont);
    };

    const handleFontWeightChange = (e) => {
        const newFontWeight = e.target.value;
        setFontWeight(newFontWeight);
        handleTextFontWeightChange(component.id, newFontWeight);
    };

    const handleTextAlignChange = (alignment) => {
        setTextAlign(alignment);
        handleTextAlignmentChange(component.id, alignment);
    };

    const handleRotationChange = () => {
        const newRotation = (rotation + 90) % 360;
        setRotation(newRotation);
        handleTextRotationChange(component.id, newRotation);
    };

    const handleFontColorChange = (e) => {
        const newFontColor = e.target.value;
        setFontColor(newFontColor);
        handleTextColorChange(component.id, newFontColor);
    };

    return (
        <div className="component-settings w-100">
            <div className="card p-0 m-0">
                <div className="card-header p-2">
                    <h5 className="card-title">Component Settings</h5>
                </div>
                <div className="card-body p-2">
                    <div className="row">
                        <div className="col">
                            <label>Width (cm):</label>
                            <input
                                type="number"
                                value={widthCM}
                                className="form-control"
                                onChange={handleWidthChange}
                            />
                        </div>
                        <div className="col">
                            <label>Height (cm):</label>
                            <input
                                type="number"
                                value={heightCM}
                                className="form-control"
                                onChange={handleHeightChange}
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label>Top (cm):</label>
                            <input
                                type="number"
                                value={topCM}
                                className="form-control"
                                onChange={handleTopChange}
                            />
                        </div>
                        <div className="col">
                            <label>Left (cm):</label>
                            <input
                                type="number"
                                value={leftCM}
                                className="form-control"
                                onChange={handleLeftChange}
                            />
                        </div>
                    </div>

                    {(component.type === 'customtext' || component.type === 'text' || component.type === 'fullname') && (
                        <>
                            <div className="row">
                                <div className="col">
                                    <label>Font Size:</label>
                                    <input
                                        type="number"
                                        value={textFontSize}
                                        className="form-control"
                                        onChange={handleTextFontSizeInputChange}
                                    />
                                </div>
                                <div className="col">
                                    <label>Font Weight:</label>
                                    <select
                                        value={fontWeight}
                                        className="form-control"
                                        onChange={handleFontWeightChange}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="bold">Bold</option>
                                        <option value="lighter">Lighter</option>
                                    </select>
                                </div>
                            </div>
                            {component.type === 'customtext' && (
                            <div className="form-group">
                                <label>Text Content:</label>
                                <input
                                    type="text"
                                    value={enteredText}
                                    className="form-control"
                                    onChange={handleTextChange}
                                />
                            </div>
                                )}

                            <div className="form-group">
                                <label>Font:</label>
                                <select
                                    value={font}
                                    className="form-control"
                                    onChange={handleFontChange}
                                >
                                    <option value="Arial">Arial</option>
                                    <option value="Verdana">Verdana</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Courier New">Courier New</option>
                                    <option value="Georgia">Georgia</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Text Alignment:</label>
                                <div>
                                    <button
                                        type="button"
                                        className={`btn btn-sm ${textAlign === 'left' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => handleTextAlignChange('left')}
                                    >
                                        <FaAlignLeft />
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn btn-sm ${textAlign === 'center' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => handleTextAlignChange('center')}
                                    >
                                        <FaAlignCenter />
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn btn-sm ${textAlign === 'right' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => handleTextAlignChange('right')}
                                    >
                                        <FaAlignRight />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {(component.type === 'customtext' || component.type === 'text' || component.type === 'fullname') && (
                        <div className="form-group">
                            <label>Text Rotation:</label>
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={handleRotationChange}
                            >
                                <FaSync />
                            </button>
                        </div>
                    )}

                    {(component.type === 'customtext' || component.type === 'text' || component.type === 'fullname') && (
                        <div className="form-group">
                            <label>Font Color:</label>
                            <input
                                type="color"
                                value={fontColor}
                                className="form-control"
                                onChange={handleFontColorChange}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComponentSettings;
