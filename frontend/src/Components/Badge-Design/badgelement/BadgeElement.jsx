import React, { useState, useRef } from 'react';
import './BadgeElement.css';
import { DraggableCore } from 'react-draggable';
import { FaTimes } from 'react-icons/fa';
import QRCode from 'qrcode.react';

const BadgeElement = ({
  id,
  content,
  textContent,
  position,
  size,
  isSelected,
  onSelect,
  onSizeChange,
  onContentChange,
  onDelete,
  onPositionChange,
  font,
  onTextFontWeightChange,
  onAlignmentChange,
  onRotationChange,
  onColorChange,
  fontWeight,
  letterCasing,
  badgeSize,
  textFontSize,
  alignment,
  rotation,
  fontColor,
  type,
  rotateBadge,
  side,
  zoom
}) => {
  const [internalContent, setInternalContent] = useState(content);
  const [isEditable, setIsEditable] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const badgeRef = useRef(null);

  console.log("Letter Casing", letterCasing);
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (!isSelected) {
      onSelect(id);
    }
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setInternalContent(newContent);
    onContentChange(id, newContent);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleBlur = () => {
    setIsEditable(false);
  };

  const handleRemove = () => {
    onDelete(id);
  };

  const handleDrag = (e, data) => {
    const zoomAdjustedX = data.x / zoom; // Adjust for zoom level
    const zoomAdjustedY = data.y / zoom; // Adjust for zoom level
    const newX = Math.max(Math.min(zoomAdjustedX, badgeSize.width - size.width), 0);
    const newY = Math.max(Math.min(zoomAdjustedY, badgeSize.height - size.height), 0);
    onPositionChange(id, {
      top: newY, left: newX, zIndex: position.zIndex,
    });
  };

  // Helper function for title case transformation
  const toTitleCase = (str) => {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  

  return (
    <DraggableCore
      bounds="parent"
      onStart={() => onSelect(id)}
      onDrag={handleDrag}
    >
      <div
        ref={badgeRef}
        id={id}
        className={`badge-element ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          width: size.width,
          height: size.height,
          transform: `rotate(${rotation || 0}deg)`,
          textTransform: letterCasing === 'uppercase'
          ? 'uppercase'
          : letterCasing === 'lowercase'
            ? 'lowercase'
            : 'none', // No direct textTransform for camelcase
          display: 'flex',
          justifyContent: alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center',
          alignItems: 'center',
          color: fontColor || '#000',
          zIndex: position.zIndex,  // Handle zIndex here
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Render different content based on type */}
        {type === 'text' || type === 'fullname' || type === 'customtext' ? (
          <div
            className="badge-element-content"
            style={{
              fontSize: textFontSize || 12,
              fontFamily: font,
              fontWeight: fontWeight || 'normal',
              color: fontColor,
              textAlign: alignment,
              textTransform: letterCasing === 'uppercase'
              ? 'uppercase'
              : letterCasing === 'lowercase'
                ? 'lowercase'
                : 'none', // No direct textTransform for camelcase
            }}
          >
            {isEditable ? (
              <textarea
                className="badge-element-textarea editable"
                placeholder="Edit text here"
                value={internalContent}
                onChange={handleContentChange}
                onBlur={handleBlur}
                autoFocus
                style={{
                  fontSize: textFontSize || 12,
                  fontFamily: font,
                  fontWeight: fontWeight || 'normal',
                  color: fontColor,
                  textAlign: alignment,
                  textTransform: letterCasing === 'uppercase'
                  ? 'uppercase'
                  : letterCasing === 'lowercase'
                    ? 'lowercase'
                    : 'none', // No direct textTransform for camelcase
                }}
              />
            ) : (
              <div
                className="badge-element-text"
                style={{
                  fontSize: textFontSize ? `${textFontSize}px` : '12px',
                  fontWeight: fontWeight,
                  color: fontColor,
                  textAlign: alignment,
                  textTransform: letterCasing === 'uppercase'
                    ? 'uppercase'
                    : letterCasing === 'lowercase'
                      ? 'lowercase'
                      : 'none', // No direct textTransform for camelcase
                }}
              >
                {letterCasing === 'titlecase'
                  ? toTitleCase(textContent || internalContent)
                  : textContent || internalContent}
              </div>
            )}
          </div>
        ) : type === 'image' ? (
          <img
            src={content}
            alt="Image"
            style={{ width: '100%', height: '100%', transform: `rotate(${rotation || 0}deg)` }}
          />
        ) : type === 'backgroundimage' ? (
          <img
            src={content}
            alt="Background"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `rotate(${rotation || 0}deg)` }}
          />
        ) : type === 'qr' ? (
          <QRCode value={content} size={size.width} />
        ) : null}

        {/* Render remove button when selected and hovered */}
        {isSelected && isHovered && (
          <div className="badge-element-remove" onClick={handleRemove}>
            <FaTimes />
          </div>
        )}
      </div>
    </DraggableCore>
  );
};

export default BadgeElement;
