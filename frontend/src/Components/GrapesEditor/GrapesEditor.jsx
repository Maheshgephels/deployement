import React, { useEffect, useState } from 'react';
import GjsEditor from '@grapesjs/react';
import 'grapesjs/dist/css/grapes.min.css';
import './css/grapes.min.css';
import SweetAlert from 'sweetalert2';
import axios from 'axios';
import { Card, CardHeader, CardBody, Button } from "reactstrap";
import { getToken } from '../../Auth/Auth';
import { useNavigate } from 'react-router-dom';
import { BackendAPI } from "../../api";

export default function GrapesEditor({ formDataToSend }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [htmlData, setHtmlData] = useState();

  console.log("HTML:", htmlData);
  console.log("Name:", name);



  const onEditor = (editor) => {
    console.log('Editor loaded', { editor });
    console.log(editor.Devices.getAll());


    // Log the contents of formDataToSend
    let htmlValue;


    for (let pair of formDataToSend.entries()) {
      const key = pair[0];
      const value = pair[1];
      if (key === 'Data') {
        htmlValue = value; // Store the value of pName
        setHtmlData(htmlValue); // Store htmlData in state
        break; // Exit the loop once pName is found (assuming it's unique)
      }
    }

    let pNameValue;


    for (let pair of formDataToSend.entries()) {
      const key = pair[0];
      const value = pair[1];
      if (key === 'pName') {
        pNameValue = value; // Store the value of pName
        setName(pNameValue);
        break; // Exit the loop once pName is found (assuming it's unique)
      }
    }

    // Inject HTML content into GrapesJS editor if htmlData is available
    if (htmlValue) {
      editor.setComponents(htmlValue); // Set the HTML content
    }

    // Save button event handler
    const handleSave = async () => {
      const htmlContent = editor.getHtml(); // Get the HTML content from the editor
      const cssContent = editor.getCss(); // Get the CSS content from the editor


      // Log the extracted pName value
      console.log('pName extracted:', pNameValue);

      // Construct combined HTML content
      const combinedContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
          <title>${pNameValue}</title>
          <style>${cssContent}</style>
        </head>
        <body>${htmlContent}</body>
        </html>
      `;

      // Append the combined content to formDataToSend
      formDataToSend.append('pageContent', combinedContent);

      // Determine API endpoint based on presence of page_id
      let apiEndpoint = `${BackendAPI}/page/storePage`; // Default endpoint for new page creation
      if (formDataToSend.has('page_id')) {
        apiEndpoint = `${BackendAPI}/page/updatePage`; // Use update endpoint if page_id exists
      }

      // Example function to send the data to the backend
      try {
        const token = getToken();
        const response = await axios.post(apiEndpoint, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log('Save response:', response.data);
        // Show success alert
        SweetAlert.fire({
          title: 'Success!',
          text: 'Page saved successfully!',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then((result) => {
          // Navigate to manage page after alert timer
          if (result.dismiss === SweetAlert.DismissReason.timer) {
            navigate(`${process.env.PUBLIC_URL}/event/manage-page/Consoft`);
          }
        });
      } catch (error) {
        console.error('Error saving content:', error);
        alert('Error saving content.');
      }
    };

    // Add event listener to save button
    const saveButton = document.getElementById("save-button");
    if (saveButton) {
      saveButton.addEventListener("click", handleSave);
    }

    // Clean up event listener when component unmounts
    return () => {
      if (saveButton) {
        saveButton.removeEventListener("click", handleSave);
      }
      editor.destroy(); // Clean up the editor instance
    };
  };


  return (
    <Card>
      <CardHeader>
        {/* <div id="editor-controls">
          <Button id="save-button" color="primary">Save</Button>
        </div> */}
        <div className='d-flex align-items-center w-100'>
          <div className="mb-2 mb-md-0 w-100">
            <h5 className="mb-2 text-start">{name} Page</h5>
          </div>
          <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">

            <Button id="save-button" color='warning'>
              Save Page
            </Button>

          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="border border-primary p-3">
          <GjsEditor
            grapesjs="https://unpkg.com/grapesjs"
            options={{
              height: '500px',
              storageManager: false,
            }}
            plugins={[
              {
                id: 'gjs-blocks-basic',
                src: 'https://unpkg.com/grapesjs-blocks-basic',
              },
            ]}
            onEditor={editor => {
              // Set default device to 'Mobile' when the editor loads
              editor.Devices.select('mobilePortrait');
              onEditor(editor);
            }}
            style={{ backgroundColor: 'white' }} // Adding inline style for background color
          />
        </div>
      </CardBody>
    </Card>
  );
}