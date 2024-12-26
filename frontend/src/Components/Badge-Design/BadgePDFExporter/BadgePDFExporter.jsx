    import React, { useEffect, useRef } from 'react';
    import { PDFViewer, Document, Page, View, Text ,Image } from '@react-pdf/renderer';
    // import QRCode from 'qrcode.react';
    


    const BadgePDFExporter = ({ badgeSize, components  }) => {
        console.log("Badge size form BadgePDFExporter:", badgeSize); // Log badgeSize
        console.log("Components from  BadgePDFExporter:", components); // Log components data

        const pdfRef = useRef(null);

        // console.log("Badge size form BadgePDFExporter:", badgeSize); // Log badgeSize
        // console.log("Components from  BadgePDFExporter:", components); // Log components data
    
    const handleDownloadPDF = () => {

        console.log("Badge size form BadgePDFExporter:", badgeSize); // Log badgeSize
        console.log("Components from  BadgePDFExporter:", components); // Log components data

        // if (pdfRef.current) {
        //     pdfRef.current.updateContainer(); // Ensure PDF content is up-to-date
        //     pdfRef.current.toBlob((blob) => {
        //         const url = window.URL.createObjectURL(blob);
        //         const a = document.createElement('a');
        //         a.href = url;
        //         a.download = 'badge_design.pdf';
        //         document.body.appendChild(a);
        //         a.click();
        //         document.body.removeChild(a);
        //         window.URL.revokeObjectURL(url);
        //     });
        // }
    };


    return (
    <div>
        <PDFViewer width="1000" height="600">
            <Document>
                <Page size={[badgeSize.width, badgeSize.height]} style={{ backgroundColor: '#ffffff' }}>
                    {/* Render badge elements */}
                    {components.map((component) => (
                        <View
                            key={component.id}
                            style={{
                                position: 'absolute',
                                top: component.position.top,
                                left: component.position.left,
                                width: component.size.width,
                                height: component.size.height,
                                fontSize: component.textFontSize || 12,
                                // justifyContent: 'center', // Adjust as needed
                                // alignItems: 'center', // Adjust as needed
                            }}
                        >
                            {/* <Text>{component.content}</Text> */}
                            {component.type === 'text' && <Text>{component.content}</Text>}
                            {component.type === 'image' && (
                                <Image
                                    src={component.content}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                       
                                    }}
                                />
                            )}
                            {component.type === 'qr' && <Text>{component.content}</Text>}
                        </View>
                    ))}

                </Page>
            </Document>
        </PDFViewer>
        <button onClick={handleDownloadPDF}>Download PDF in pdf</button>
        </div>
    );
};



export default BadgePDFExporter;
