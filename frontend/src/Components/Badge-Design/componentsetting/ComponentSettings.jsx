import React, { useState, useEffect } from 'react';
import { Button } from 'reactstrap';
import { Tooltip } from 'react-tooltip';
import { RxLetterCaseLowercase, RxLetterCaseUppercase, RxLetterCaseCapitalize } from "react-icons/rx";
import { FaAlignLeft, FaAlignCenter, FaAlignRight, FaSync, FaArrowDown, FaArrowUp } from 'react-icons/fa'; // Icons for alignment and rotation
import { BsAlphabetUppercase } from 'react-icons/bs';

const ComponentSettings = ({
    component, // Current selected component
    handleComponentSizeChange,
    handleComponentPositionChange,
    handleTextFontSizeChange,
    handleTextContentChange,
    handleTextCaseChange,
    handleTextFontChange,
    handleTextFontWeightChange,
    handleTextAlignmentChange,
    handleTextRotationChange,
    handleTextColorChange,
    AllComponent
}) => {
    const [enteredText, setEnteredText] = useState(component.content);
    const [enteredCase, setEnteredCase] = useState(component.content);
    const [widthCM, setWidthCM] = useState('');
    const [heightCM, setHeightCM] = useState('');
    const [topCM, setTopCM] = useState('');
    const [leftCM, setLeftCM] = useState('');
    const [zIndex, setZindex] = useState('');
    const [textFontSize, setTextFontSize] = useState('');
    const [font, setFont] = useState('Arial');  // Default system font
    const [fontWeight, setFontWeight] = useState('normal');
    const [textAlign, setTextAlign] = useState('');
    const [textCase, setTextCase] = useState('');
    const [rotation, setRotation] = useState(0);
    const [fontColor, setFontColor] = useState('#000000');

    const CM_TO_PX = 37.795276;

    console.log("Alignment", handleTextAlignmentChange);
    console.log("Alignment Type", textAlign);
    console.log("Z-Index", component);
    console.log("Latest Z-Index", zIndex);


    console.log("All Component", AllComponent);



    useEffect(() => {
        if (component) {
            setWidthCM((component.size?.width / CM_TO_PX).toString() || '');
            setHeightCM((component.size?.height / CM_TO_PX).toString() || '');
            setTopCM((component.position?.top / CM_TO_PX).toString() || '');
            setLeftCM((component.position?.left / CM_TO_PX).toString() || '');
            // setZindex((component.position?.zIndex));
            setTextFontSize(component.textFontSize || '');
            setFont(component.font || 'Arial');  // Set default font
            setTextCase(component.textcase || 'titlecase');  // Set default font
            setFontWeight(component.fontWeight || 'normal');
            setTextAlign(component.alignment || 'center');
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

    // const handleTextCaseChange = (caseType) => {
    //     let modifiedText = enteredText;
    //     if (caseType === 'upper') {
    //         modifiedText = enteredText.toUpperCase();
    //     } else if (caseType === 'camel') {
    //         modifiedText = enteredText.replace(/\b\w/g, (char) => char.toUpperCase());
    //     } else if (caseType === 'lower') {
    //         modifiedText = enteredText.toLowerCase();
    //     }

    //     setTextCase(modifiedText);
    //     handleTextContentChange(modifiedText);
    // };

    const handleTextCasingChange = (caseType) => {
        setTextCase(caseType);
        handleTextCaseChange(component.id, caseType);

        // let modifiedText = enteredText;
        // if (caseType === 'upper') {
        //     modifiedText = enteredText.toUpperCase();
        // } else if (caseType === 'camel') {
        //     modifiedText = enteredText.replace(/\b\w/g, (char) => char.toUpperCase());
        // } else if (caseType === 'lower') {
        //     modifiedText = enteredText.toLowerCase();
        // }

        // setTextCase(modifiedText);
        // handleTextContentChange(modifiedText);
        handleTextCaseChange(caseType);
    };


    const handleTextAlignChange = (alignment) => {
        setTextAlign(alignment);
        handleTextAlignmentChange(component.id, alignment);
    };

    const handleZIndexChange = (change) => {
        // Fetch zIndex from component.position or default to 0 if undefined
        const currentZIndex = component.position?.zIndex || 0;
        const newZIndex = currentZIndex + change;
        console.log("Old Z-Index:", currentZIndex);
        // if (newZIndex === 1){
        //     setZindex('1');
        // }else{
        //     setZindex('2');
        // }

        console.log("New Z-Index:", newZIndex);
        if (!isNaN(newZIndex)) {
            handleComponentPositionChange(component.id, { ...component.position, zIndex: newZIndex });
        }
    };

    // const handleZIndexChange = (change) => {
    //     // Fetch the current zIndex from the component or default to 0 if undefined
    //     const currentZIndex = component.position?.zIndex || 0;
    //     const newZIndex = currentZIndex + change;

    //     console.log("Old Z-Index:", currentZIndex);
    //     console.log("New Z-Index:", newZIndex);

    //     if (!isNaN(newZIndex)) {
    //         if (newZIndex === 1) {
    //             console.log("Before Update: All Components Z-Index");
    //             AllComponent.forEach((comp) => {
    //                 console.log(`Component ID: ${comp.id}, Z-Index: ${comp.position?.zIndex || 0}`);
    //             });

    //             // Adjust the zIndex of all components to avoid conflicts
    //             AllComponent.forEach((comp) => {
    //                 if (comp.id !== component.id) {
    //                     const updatedZIndex = (comp.position?.zIndex || 0) + 1;
    //                     console.log(`Updating Component ID: ${comp.id}, New Z-Index: ${updatedZIndex}`);
    //                     handleComponentPositionChange(comp.id, {
    //                         ...comp.position,
    //                         zIndex: updatedZIndex,
    //                     });
    //                 }
    //             });

    //             // Finally, update the zIndex of the current component to 2
    //             console.log(`Updating Current Component ID: ${component.id}, New Z-Index: 2`);
    //             handleComponentPositionChange(component.id, {
    //                 ...component.position,
    //                 zIndex: 2,
    //             });

    //             console.log("After Update: All Components Z-Index");
    //             AllComponent.forEach((comp) => {
    //                 console.log(`Component ID: ${comp.id}, Z-Index: ${comp.position?.zIndex || 0}`);
    //             });
    //         } else {
    //             // Update only the current component's zIndex
    //             console.log(`Updating Current Component ID: ${component.id}, New Z-Index: ${newZIndex}`);
    //             handleComponentPositionChange(component.id, {
    //                 ...component.position,
    //                 zIndex: newZIndex,
    //             });
    //         }
    //     }
    // };




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

                    {(component.type === 'customtext' || component.type === 'text' || component.type === 'fullname' || component.type === 'qr' || component.type === 'image') && (
                        <>
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
                                        <label>Text Casing:</label>
                                        <div>
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${textCase === 'uppercase' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => handleTextCasingChange('uppercase')}
                                            >
                                                <RxLetterCaseUppercase />
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${textCase === 'titlecase' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => handleTextCasingChange('titlecase')}
                                            >
                                                <RxLetterCaseCapitalize />
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${textCase === 'lowercase' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => handleTextCasingChange('lowercase')}
                                            >
                                                <RxLetterCaseLowercase />
                                            </button>
                                        </div>
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
                            <div className="form-group">
                                <label>Actions:</label>
                                <div>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        outline
                                        onClick={() => handleZIndexChange(1)} // Move Forward
                                        className="me-2"
                                        data-tooltip-id="forward"
                                    >
                                        <FaArrowUp />
                                    </Button>
                                    <Tooltip id="forward" place="top" effect="solid">
                                        Bring to Front
                                    </Tooltip>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        outline
                                        disabled={zIndex === '1'}
                                        onClick={() => handleZIndexChange(-1)} // Move Backward
                                        data-tooltip-id="backward"
                                    >
                                        <FaArrowDown />
                                    </Button>
                                    <Tooltip id="backward" place="top" effect="solid">
                                        Move to Back
                                    </Tooltip>
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
