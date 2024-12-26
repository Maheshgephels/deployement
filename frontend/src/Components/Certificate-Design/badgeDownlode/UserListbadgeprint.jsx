// import React, { useState, useEffect } from 'react';
// import jsPDF from 'jspdf';
// import QRCode from 'qrcode';

// const PX_TO_MM = 25.4 / 96;

// const generatePDFFromBadgeListforList = async (badgeList) => {
//     console.log('Badge List on generatePDFFromBadgeListforList:', badgeList);
//     try {
//         // Assuming the first badge's dimensions represent the page size
//         const firstBadgeData = badgeList[0];
//         console.log('Width:', firstBadgeData.width);
//         console.log('Height:', firstBadgeData.height);
//         const { width, height, orientation, badge_fields } = firstBadgeData;
//         const numericWidth = parseFloat(width) * PX_TO_MM;
//         const numericHeight = parseFloat(height) * PX_TO_MM;


//         // console.log(`Page width: ${numericWidth} mm, Page height: ${numericHeight} mm`);
//         // const lowercaseOrientation = orientation;

//         const pdf = new jsPDF({
//             orientation: orientation, // or 'portrait' for portrait orientation
//             unit: 'mm', // using millimeters as the unit
//             format: [numericWidth, numericHeight] // set the page size (width, height) in millimeters
//         });

//         pdf.deletePage(1);
//         for (let i = 0; i < badgeList.length; i++) {
//             const badgeData = badgeList[i];
//             const { badge_fields, orientation } = badgeData;

//             // pdf.addPage([numericWidth, numericHeight]);
//             pdf.addPage({
//                 // format: [numericWidth, numericHeight],
//                 // orientation: lowercaseOrientation
//             });

//             const backgroundImageField = badge_fields.find(field => field.cs_field_type_id === 'backgroundimage');

//             if (backgroundImageField) {
//                 const backgroundImageUrl = backgroundImageField.cs_field_content;
//                 console.log('Adding backgroundImageUrl:', backgroundImageUrl);
//                 const backgroundImageX = parseFloat(backgroundImageField.cs_field_position_x / 3.78);
//                 const backgroundImageY = parseFloat(backgroundImageField.cs_field_position_y / 3.78);
//                 const pageWidth = parseFloat(backgroundImageField.cs_field_width / 3.78);
//                 const pageHeight = parseFloat(backgroundImageField.cs_field_height / 3.78);
//                 const imageData = await loadImageAsBase64(backgroundImageUrl);
//                 pdf.addImage(imageData, 'JPEG', backgroundImageX, backgroundImageY, pageWidth, pageHeight);
//             }
//             // Render elements (text, images, QR codes, etc.) for the current badge
//             await Promise.all(badge_fields.map(async (field) => {

//                 switch (field.cs_field_type_id) {


//                     // case 'text':
//                     // case 'number':
//                     //     let fontSize = parseFloat(field.cs_text_size);
//                     //     const containerX = parseFloat(field.cs_field_position_x) / 3.78;
//                     //     const containerY = parseFloat(field.cs_field_position_y) / 3.78;
//                     //     const containerWidth = parseFloat(field.cs_field_width) / 3.78;
//                     //     const containerHeight = parseFloat(field.cs_field_height) / 3.78;

//                     //     // Set the font size
//                     //     pdf.setFontSize(fontSize);

//                     //     // Calculate the center of the container
//                     //     const centerX = containerX + containerWidth / 2;
//                     //     const centerY = containerY + containerHeight / 2;

//                     //     // Get the width of the text
//                     //     const textWidth = pdf.getStringUnitWidth(field.cs_field_name) * fontSize / pdf.internal.scaleFactor;

//                     //     // Calculate the starting point of the text to position it at the center
//                     //     const textX = centerX - (textWidth / 2); // Adjusting for text width
//                     //     const textY = centerY + (fontSize / 4); // Adjusting for font size and baseline

//                     //     // Add the text to the PDF at the calculated position
//                     //     pdf.text(textX, textY, field.cs_field_name);
//                     //     break;

//                     case 'text':
//                     case 'number':
//                         let fontSize = parseFloat(field.cs_text_size);
//                         const containerX = parseFloat(field.cs_field_position_x) / 3.78;
//                         const containerY = parseFloat(field.cs_field_position_y) / 3.78;
//                         const containerWidth = parseFloat(field.cs_field_width) / 3.78;
//                         const containerHeight = parseFloat(field.cs_field_height) / 3.78;
//                         // const CustomTextBold = (field.textBold === true);


//                         // Ensure text content is a string
//                         const textContent = String(field.cs_field_name || '');

//                         console.log("field.cs_field_name",field.cs_field_name);

//                         // Set the font size
//                         pdf.setFontSize(fontSize);

//                         if(field.textBold == true){
//                             pdf.setFont("helvetica", "bold");
//                         }
//                         else{
//                             pdf.setFont("helvetica", "normal");
//                         }

//                         // Calculate the center of the container
//                         const centerX = containerX + containerWidth / 2;
//                         const centerY = containerY + containerHeight / 2;

//                         // Add the text to the PDF at the center
//                         // pdf.text(textContent, centerX, centerY, { align: 'center' });
//                         // If needed, adjust vertical position for better alignment
//                         const adjustedCenterY = centerY + (fontSize / 4);

//                         // Add the text to the PDF at the calculated position with centered alignment
//                         pdf.text(textContent, centerX, adjustedCenterY, { align: 'center' });
//                         break;


//                     case 'customtext': // Add support for customtext
//                         let customFontSize = parseFloat(field.cs_text_size);
//                         const customContainerX = parseFloat(field.cs_field_position_x) / 3.78;
//                         const customContainerY = parseFloat(field.cs_field_position_y) / 3.78;
//                         const customcontainerWidth = parseFloat(field.cs_field_width) / 3.78;
//                         const customcontainerHeight = parseFloat(field.cs_field_height) / 3.78;

//                         // Set the font size
//                         pdf.setFontSize(customFontSize);

//                         // Calculate the center of the container
//                         const customCenterX = customContainerX + customcontainerWidth / 2;
//                         const customCenterY = customContainerY + customcontainerHeight / 2;

//                         // Get the width of the text
//                         const customTextWidth = pdf.getStringUnitWidth(field.cs_field_label) * customFontSize / pdf.internal.scaleFactor;

//                         // Calculate the starting point of the text to position it at the center
//                         const customTextX = customCenterX - (customTextWidth / 2); // Adjusting for text width
//                         const customTextY = customCenterY + (customFontSize / 4); // Adjusting for font size and baseline

//                         // Add the text to the PDF at the calculated position
//                         pdf.text(customTextX, customTextY, field.cs_field_label);
//                         break;


//                     case 'fullname':
//                         let fullNameFontSize = parseFloat(field.cs_text_size);
//                         const fullNameContainerX = parseFloat(field.cs_field_position_x) / 3.78;
//                         const fullNameContainerY = parseFloat(field.cs_field_position_y) / 3.78;
//                         const fullNamecontainerWidth = parseFloat(field.cs_field_width) / 3.78;
//                         const fullNamecontainerHeight = parseFloat(field.cs_field_height) / 3.78;

//                         // Set the font size
//                         pdf.setFontSize(fullNameFontSize);

//                         // Calculate the center of the container
//                         const fullNameCenterX = fullNameContainerX + fullNamecontainerWidth / 2;
//                         const fullNameCenterY = fullNameContainerY + fullNamecontainerHeight / 2;

//                         // Get the width of the text
//                         const fullNameTextWidth = pdf.getStringUnitWidth(field.cs_field_name) * fullNameFontSize / pdf.internal.scaleFactor;

//                         // Calculate the starting point of the text to position it at the center
//                         const fullNameTextX = fullNameCenterX - (fullNameTextWidth / 2); // Adjusting for text width
//                         const fullNameTextY = fullNameCenterY + (fullNameFontSize / 4); // Adjusting for font size and baseline
//                         pdf.setFont("helvetica", "bold");

//                         // Add the text to the PDF at the calculated position
//                         pdf.text(fullNameTextX, fullNameTextY, field.cs_field_name);
//                         break;


//                     case 'image':
//                         const imageX = parseFloat(field.cs_field_position_x / 3.78);
//                         const imageY = parseFloat(field.cs_field_position_y / 3.78);
//                         const imageWidth = parseFloat(field.cs_field_width / 3.78);
//                         const imageHeight = parseFloat(field.cs_field_height / 3.78);
//                         const imageUrl = field.cs_field_content;
//                         console.log('Adding image:', imageUrl);
//                         const imageData = await loadImageAsBase64(imageUrl);
//                         // console.log('Image data:', imageData);
//                         pdf.addImage(imageData, 'JPEG', imageX, imageY, imageWidth, imageHeight);
//                         break;
//                     // case 'qr':
//                     //     const qrData = field.cs_field_name;

//                     //     const qrX =  parseFloat(field.cs_field_position_y / 3.78);
//                     //     const qrY = parseFloat(field.cs_field_position_y / 3.78);
//                     //     const qrSizeWidth = parseFloat(field.cs_field_width / 3.78);
//                     //     const qrSizeHeight = parseFloat(field.cs_field_height / 3.78);
//                     //     // const qrSize = 50;
//                     //     // const qrImage =  QRCode.toDataURL(qrData, { width: qrSizeWidth, height: qrSizeHeight });
//                     //     // pdf.addImage(qrImage, 'PNG', qrX, qrY, qrSize, qrSize);
//                     //     const qrImage = await QRCode.toDataURL(qrData, { width: qrSizeWidth, height: qrSizeHeight });
//                     //     pdf.addImage(qrImage, 'PNG', qrX, qrY, qrSizeWidth, qrSizeHeight);
//                     //     break;
//                     case 'qr':

//                         const qrData = field.cs_field_name.toString();

//                         console.log("QR:", qrData);

//                         const qrX = parseFloat(field.cs_field_position_x) / 3.78;
//                         const qrY = parseFloat(field.cs_field_position_y) / 3.78;
//                         const qrSizeWidth = parseFloat(field.cs_field_width) / 3.78;
//                         const qrSizeHeight = parseFloat(field.cs_field_height) / 3.78;
//                         console.log("QR Position (X, Y):", qrX, qrY);
//                         console.log("QR Size (Width, Height):", qrSizeWidth, qrSizeHeight);

//                         const qrOptions = {
//                             errorCorrectionLevel: 'H',
//                             margin: 0,
//                             width: qrSizeWidth,
//                             height: qrSizeHeight,
//                             scale: 1
//                         };
//                         try {
//                             const qrImage = await QRCode.toDataURL(qrData);
//                             pdf.addImage(qrImage, 'PNG', qrX, qrY, qrSizeWidth, qrSizeHeight);
//                         } catch (error) {
//                             console.error('Error generating QR code:', error);
//                         }
//                         break;

//                     default:
//                         break;
//                 }
//             }));
//         }

//         // Save the PDF document
//         pdf.save('badges.pdf');
//     } catch (error) {
//         console.error('Error generating PDF:', error);
//     }
// };

// const loadImageAsBase64 = async (imageUrl) => {
//     const response = await fetch(imageUrl);
//     if (!response.ok) {
//         throw new Error('Failed to load image');
//     }
//     const contentType = response.headers.get('content-type');
//     const blob = await response.blob();
//     const reader = new FileReader();
//     return new Promise((resolve, reject) => {
//         reader.onloadend = () => resolve(reader.result);
//         reader.onerror = reject;
//         if (contentType.startsWith('image/svg')) {
//             // For SVG images, convert to base64 directly
//             reader.readAsDataURL(blob);
//         } else {
//             // For other image types (PNG, JPEG), convert to base64 after creating an Image object
//             const img = new Image();
//             img.onload = () => {
//                 const canvas = document.createElement('canvas');
//                 canvas.width = img.width;
//                 canvas.height = img.height;
//                 const ctx = canvas.getContext('2d');
//                 ctx.drawImage(img, 0, 0);
//                 const base64ImageData = canvas.toDataURL(contentType);
//                 resolve(base64ImageData);
//             };
//             img.onerror = reject;
//             img.src = URL.createObjectURL(blob);
//         }
//     });
// };
// // Function to load image as base64 remains the same

// export default generatePDFFromBadgeListforList;

import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const PX_TO_MM = 25.4 / 96; // Conversion from pixels to mm

const generatePDFFromBadgeListforList = async (badgeList) => {
  console.log('Badge List on generatePDFFromBadgeListforList:', badgeList);
  try {
    const firstBadgeData = badgeList[0];
    const { width, height, orientation, type } = firstBadgeData;

    // Convert dimensions to mm
    const numericWidth = parseFloat(width) * PX_TO_MM;
    const numericHeight = parseFloat(height) * PX_TO_MM;

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: [numericWidth, numericHeight],
    });

    pdf.deletePage(1);

    const pageWidth = numericWidth; // Define pageWidth

    // Loop through badge list to render badges
    for (let i = 0; i < badgeList.length; i++) {

      //   const firstBadgeData = badgeList[0];
      // const { width, height, orientation,type } = firstBadgeData;

      const badgeData = badgeList[i];
      // console.log("firstBadgeData",badgeData);
      const { type, badge_fields } = badgeData;

      // Add a page for the badge
      pdf.addPage();

      // Render badge normally
      await renderBadgeOnPage(pdf, badge_fields, numericHeight, false);

      // Render mirrored badge

      if (type == "Mirror") {
        await renderBadgeOnPage(pdf, badge_fields, numericHeight, true, pageWidth);
      }
    }

    // Save the PDF
    pdf.save('Certificate.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

// Update renderBadgeOnPage to accept pageWidth as a parameter
const renderBadgeOnPage = async (pdf, badge_fields, pageHeight, isMirrored, pageWidth) => {
  try {
    const originalFields = [];

    for (const field of badge_fields) {
      const fontSize = parseFloat(field.cs_text_size) || 12; // Ensure valid font size
      const containerX = parseFloat(field.cs_field_position_x) / 3.78 || 0;
      const containerY = parseFloat(field.cs_field_position_y) / 3.78 || 0;
      const containerWidth = parseFloat(field.cs_field_width) / 3.78 || 50;
      const containerHeight = parseFloat(field.cs_field_height) / 3.78 || 20;
      const textColor = field.cs_field_color || '#000000';
      const textAlign = field.cs_field_alignment || 'center';
      const fontType = field.cs_font || 'helvetica';
      const fontWeight = field.cs_field_weight ? 'bold' : 'normal';
      const rotationAngle = parseFloat(field.cs_field_rotate) || 0;

      const textContent = field.cs_field_name ? String(field.cs_field_name) : '';

      // Store original fields for later use
      originalFields.push({ field, containerX, containerY, containerWidth, containerHeight, fontSize, textColor, textAlign, fontType, fontWeight, rotationAngle, textContent });
    }

    const backgroundImageField = badge_fields.find(field => field.cs_field_type_id === 'backgroundimage');

    if (backgroundImageField) {
      const isDouble = backgroundImageField.cs_badge_side === 'Back';
      const containerX = parseFloat(backgroundImageField.cs_field_position_x) / 3.78 || 0;
      const containerY = parseFloat(backgroundImageField.cs_field_position_y) / 3.78 || 0;
      const pageWidth = parseFloat(backgroundImageField.cs_field_width / 3.78);
      const pageHeight = parseFloat(backgroundImageField.cs_field_height / 3.78);
      const containerWidth = parseFloat(backgroundImageField.cs_field_width) / 3.78 || 50;
      const containerHeight = parseFloat(backgroundImageField.cs_field_height) / 3.78 || 20;

      const mirroredY = pageHeight - containerX - containerHeight; // Adjust for mirroring
      const mirroredX = pageWidth - containerY - containerWidth; // Adjust X position for mirroring


      if (isDouble) {
        const imageUrl = backgroundImageField.cs_field_content;
        const rotatedImageData = await rotateImage(imageUrl);
        pdf.addImage(rotatedImageData, 'JPEG', mirroredX, mirroredY, pageWidth, pageHeight);
      } else {
        const backgroundImageUrl = backgroundImageField.cs_field_content;
        console.log('Adding backgroundImageUrl:', backgroundImageUrl);
        const backgroundImageX = parseFloat(backgroundImageField.cs_field_position_x / 3.78);
        const backgroundImageY = parseFloat(backgroundImageField.cs_field_position_y / 3.78);
        const pageWidth = parseFloat(backgroundImageField.cs_field_width / 3.78);
        const pageHeight = parseFloat(backgroundImageField.cs_field_height / 3.78);
        const imageData = await loadImageAsBase64(backgroundImageUrl);
        pdf.addImage(imageData, 'JPEG', backgroundImageX, backgroundImageY, pageWidth, pageHeight);
      }
    }

    // Render badge normally
    for (const { field, containerX, containerY, containerWidth, containerHeight, fontSize, textColor, textAlign, fontType, fontWeight, rotationAngle, textContent } of originalFields) {

      // Calculate mirrored positions for X and Y
      const mirroredY = pageHeight - containerY - containerHeight; // Adjust for mirroring vertically
      const mirroredX = pageWidth - containerX - containerWidth; // Adjust for mirroring horizontally

      console.log("field", field);

      const isDouble = field.cs_badge_side === 'Back';
      switch (field.cs_field_type_id) {
        case 'text':
        case 'number':


          pdf.setFont(fontType, fontWeight);
          pdf.setFontSize(fontSize);
          pdf.setTextColor(textColor);

          if (isDouble) {


            // Calculate the width of the text content
            const textWidth = pdf.getStringUnitWidth(textContent) * fontSize / pdf.internal.scaleFactor;

            // Adjust X and Y for mirrored view and 180-degree rotation
            const mirroredCenteredX = pageWidth - (containerX + containerWidth / 2) + textWidth / 2; // Reverse X adjustment
            const mirroredCenteredY = pageHeight - (containerY + containerHeight / 2) - (fontSize / 4); // Adjust Y for baseline

            // Render the text with rotation applied at the adjusted position
            pdf.text(textContent, mirroredCenteredX, mirroredCenteredY, { angle: rotationAngle + 180 });
          }
          else {

            // Ensure text content is a string
            const textContent = String(field.cs_field_name || '');

            console.log("field.cs_field_name", field.cs_field_name);

            // Calculate the center of the container
            const centerX = containerX + containerWidth / 2;
            const centerY = containerY + containerHeight / 2;

            // Add the text to the PDF at the center
            // pdf.text(textContent, centerX, centerY, { align: 'center' });
            // If needed, adjust vertical position for better alignment
            const adjustedCenterY = centerY + (fontSize / 4);

            // Add the text to the PDF at the calculated position with centered alignment
            pdf.text(textContent, centerX, adjustedCenterY, { angle: rotationAngle });

          }
          break;

        case 'image':
          const imageX = parseFloat(field.cs_field_position_x / 3.78);
          const imageY = parseFloat(field.cs_field_position_y / 3.78);
          const imageWidth = parseFloat(field.cs_field_width / 3.78);
          const imageHeight = parseFloat(field.cs_field_height / 3.78);
          const imageUrl = field.cs_field_content;
          console.log('Adding image:', imageUrl);

          if (!isDouble) {
            // Load the image as base64
            const imageData = await loadImageAsBase64(imageUrl);
            pdf.addImage(imageData, 'PNG', imageX, imageY, imageWidth, imageHeight);
          }
          else {
            const rotatedImageData = await rotateImage(imageUrl);
            // Add the image in mirrored position (no rotation needed)
            pdf.addImage(rotatedImageData, 'JPEG', mirroredX, mirroredY, containerWidth, containerHeight);
          }

          // Use PNG instead of JPEG to handle transparency
          break;

        case 'qr':
          const qrData = field.cs_field_name ? field.cs_field_name.toString() : '';
          const qrImage = await QRCode.toDataURL(qrData);
          if (isDouble) {
            const rotatedQrData = await rotateImage(qrImage);
            pdf.addImage(rotatedQrData, 'PNG', containerX, containerY, containerWidth, containerHeight);
          }
          else {

            pdf.addImage(qrImage, 'PNG', containerX, containerY, containerWidth, containerHeight);
          }
          break;

        case 'fullname':
          let fullNameFontSize = parseFloat(field.cs_text_size);
          const fullNameContainerX = parseFloat(field.cs_field_position_x) / 3.78;
          const fullNameContainerY = parseFloat(field.cs_field_position_y) / 3.78;
          const fullNamecontainerWidth = parseFloat(field.cs_field_width) / 3.78;
          const fullNamecontainerHeight = parseFloat(field.cs_field_height) / 3.78;

          pdf.setFont(fontType, fontWeight);
          pdf.setFontSize(fontSize);
          pdf.setTextColor(textColor);

          // Calculate the center of the container
          const fullNameCenterX = fullNameContainerX + fullNamecontainerWidth / 2;
          const fullNameCenterY = fullNameContainerY + fullNamecontainerHeight / 2;

          // Get the width of the text
          const fullNameTextWidth = pdf.getStringUnitWidth(field.cs_field_name) * fullNameFontSize / pdf.internal.scaleFactor;

          // Calculate the starting point of the text to position it at the center
          const fullNameTextX = fullNameCenterX - (fullNameTextWidth / 2); // Adjusting for text width
          const fullNameTextY = fullNameCenterY + (fullNameFontSize / 4); // Adjusting for font size and baseline

          // Add the text to the PDF at the calculated position
          pdf.text(fullNameTextX, fullNameTextY, field.cs_field_name, { angle: rotationAngle });
          break;

        case 'customtext': // Add support for customtext
          const customFontSize = parseFloat(field.cs_text_size);
          const customContainerX = parseFloat(field.cs_field_position_x) / 3.78;
          const customContainerY = parseFloat(field.cs_field_position_y) / 3.78;
          const customcontainerWidth = parseFloat(field.cs_field_width) / 3.78;
          const customcontainerHeight = parseFloat(field.cs_field_height) / 3.78;

          pdf.setFont(fontType, fontWeight);
          pdf.setFontSize(fontSize);
          pdf.setTextColor(textColor);

          // Calculate the center of the container
          const customCenterX = customContainerX + customcontainerWidth / 2;
          const customCenterY = customContainerY + customcontainerHeight / 2;

          // Get the width of the text
          const customTextWidth = pdf.getStringUnitWidth(field.cs_field_label) * customFontSize / pdf.internal.scaleFactor;

          if (isDouble) {
            const coustomtextTextWidth = pdf.getStringUnitWidth(String(field.cs_field_label)) * fontSize / pdf.internal.scaleFactor;
            const coustomtextMirroredX = pageWidth - (containerX + coustomtextTextWidth / 2);
            const coustomtextMirroredY = pageHeight - (containerY + (fontSize / 4));
            pdf.text(coustomtextMirroredX, coustomtextMirroredY, String(field.cs_field_label), { angle: rotationAngle + 180 });
          }
          else {
            // Calculate the starting point of the text to position it at the center
            const customTextX = customCenterX - (customTextWidth / 2); // Adjusting for text width
            const customTextY = customCenterY + (customFontSize / 4); // Adjusting for font size and baseline

            // Add the text to the PDF at the calculated position
            pdf.text(customTextX, customTextY, field.cs_field_label, { angle: rotationAngle });
          }
          break;

        default:
          break;
      }
    }

    if (isMirrored) {
      const containerX = parseFloat(badge_fields.cs_field_position_x) / 3.78 || 0;
      const containerY = parseFloat(badge_fields.cs_field_position_y) / 3.78 || 0;
      const containerWidth = parseFloat(badge_fields.cs_field_width) / 3.78 || 50;
      const containerHeight = parseFloat(badge_fields.cs_field_height) / 3.78 || 20;
      const backgroundImageField = badge_fields.find(field => field.cs_field_type_id === 'backgroundimage');

      if (backgroundImageField) {
        const pageWidth = parseFloat(backgroundImageField.cs_field_width) / 3.78;
        const pageHeight = parseFloat(backgroundImageField.cs_field_height) / 3.78;

        // Calculate the starting Y position for the bottom half
        const bottomHalfStart = pageHeight / 2;

        // Set mirroredX to 0 to cover the full width
        const mirroredX = 0; // Start from the left edge
        const mirroredY = bottomHalfStart; // Start at the top of the bottom half
        const mirroredYHalf = bottomHalfStart; // Start at the top of the bottom half

        const finalmirroredY = mirroredY + mirroredYHalf; // ;

        const imageUrl = backgroundImageField.cs_field_content;
        const rotatedImageData = await rotateImage(imageUrl);

        // Set the image dimensions
        const rotatedWidth = pageWidth;  // Full width of the page
        const rotatedHeight = pageHeight; // Half the height of the page for the bottom half

        // Add the image to the PDF at the calculated position
        pdf.addImage(rotatedImageData, 'JPEG', mirroredX, finalmirroredY, rotatedWidth, rotatedHeight);

      }

      for (const { field, containerX, containerY, containerWidth, containerHeight, fontSize, textColor, textAlign, fontType, fontWeight, rotationAngle, textContent } of originalFields) {

        // Calculate mirrored positions for X and Y
        const mirroredY = pageHeight - containerY - containerHeight; // Adjust for mirroring vertically
        const mirroredX = pageWidth - containerX - containerWidth; // Adjust for mirroring horizontally

        switch (field.cs_field_type_id) {
          case 'text':
          case 'number':

            pdf.setFont(fontType, fontWeight);
            pdf.setFontSize(fontSize);
            pdf.setTextColor(textColor);

            // Calculate the width of the text content
            const textWidth = pdf.getStringUnitWidth(textContent) * fontSize / pdf.internal.scaleFactor;

            // Adjust X and Y for mirrored view and 180-degree rotation
            const mirroredCenteredX = pageWidth - (containerX + containerWidth / 2) + textWidth / 2; // Reverse X adjustment
            const mirroredCenteredY = pageHeight - (containerY + containerHeight / 2) - (fontSize / 4); // Adjust Y for baseline

            // Render the text with rotation applied at the adjusted position
            pdf.text(textContent, mirroredCenteredX, mirroredCenteredY, { angle: rotationAngle });
            break;


          case 'image':
            const imageUrl = field.cs_field_content;
            const rotatedImageData = await rotateImage(imageUrl);

            // Add the image in mirrored position (no rotation needed)
            pdf.addImage(rotatedImageData, 'JPEG', mirroredX, mirroredY, containerWidth, containerHeight);
            break;

          case 'qr':
            const qrData = field.cs_field_name ? field.cs_field_name.toString() : '';
            const qrImage = await QRCode.toDataURL(qrData);
            const rotatedQrData = await rotateImage(qrImage);

            // Add the rotated QR code image at the mirrored position
            pdf.addImage(rotatedQrData, 'PNG', mirroredX, mirroredY, containerWidth, containerHeight);
            break;

          case 'fullname':

            pdf.setFontSize(fontSize);
            pdf.setFont(fontType, fontWeight);
            pdf.setTextColor(textColor);

            // Calculate the width of the full name text
            const fullNameTextWidth = pdf.getStringUnitWidth(String(field.cs_field_name)) * fontSize / pdf.internal.scaleFactor;

            // Adjust X and Y for mirrored view and 180-degree rotation
            const fullNameMirroredX = pageWidth - (containerX + containerWidth / 2) + fullNameTextWidth / 2; // Reverse X adjustment
            const fullNameMirroredY = pageHeight - (containerY + containerHeight / 2) - (fontSize / 4); // Adjust Y for baseline

            // Render the text with rotation applied at the adjusted position
            pdf.text(String(field.cs_field_name), fullNameMirroredX, fullNameMirroredY, { angle: rotationAngle });
            break;

          case 'customtext':

            pdf.setFont(fontType, fontWeight);
            pdf.setFontSize(fontSize);
            pdf.setTextColor(textColor);

            // Calculate the width of the custom text
            const customTextWidth = pdf.getStringUnitWidth(String(field.cs_field_label)) * fontSize / pdf.internal.scaleFactor;

            // Adjust X and Y for mirrored view and 180-degree rotation
            const customTextMirroredX = pageWidth - (containerX + containerWidth / 2) + customTextWidth / 2; // Reverse X adjustment
            const customTextMirroredY = pageHeight - (containerY + containerHeight / 2) - (fontSize / 4); // Adjust Y for baseline

            // Render the custom text with rotation applied at the adjusted position
            pdf.text(String(field.cs_field_label), customTextMirroredX, customTextMirroredY, { angle: rotationAngle });
            break;


          default:
            break;
        }
      }


    }
  } catch (error) {
    console.error('Error rendering badge:', error);
  }
};


// Helper function to load image as base64
const loadImageAsBase64 = async (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Handle CORS issues
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      // Convert to PNG for images with transparency
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
  });
};

// Function to rotate the image 180 degrees
const rotateImage = async (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Allow cross-origin image access
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      // Rotate the context by 180 degrees around the center
      ctx.translate(canvas.width / 2, canvas.height / 2); // Move origin to center
      ctx.rotate(Math.PI); // Rotate by 180 degrees
      ctx.drawImage(img, -img.width / 2, -img.height / 2); // Draw image centered

      // Convert to PNG for images with transparency
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
  });
};


export default generatePDFFromBadgeListforList;
