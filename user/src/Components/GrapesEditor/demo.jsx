// import React, { useEffect, useState } from "react";
// import "grapesjs/dist/css/grapes.min.css";
// import grapesjs from "grapesjs";
// import gsWebpage from "grapesjs-preset-webpage";
// import gsCustomCode from "grapesjs-custom-code";
// import gsTabs from "grapesjs-tabs";

// const GrapesEditor = () => {
//   const [editor, setEditor] = useState(null);

//   useEffect(() => {
//     if (!editor) {
//       const e = grapesjs.init({
//         color: "white",
//         height: "100vh",
//         width: "auto",
//         container: "#g",
//         fromElement: true,
//         plugins: [gsWebpage, gsCustomCode, gsTabs],
//         storageManager: {
//           type: "remote",
//           urlStore:
//             "http://173.249.14.149:3001/api/Dashboards/5ef370de14213070188a41eb/grapes?access_token=B6IES26pZSvpX4J8c8q4wmseASpRtmBOtvXzztH57NDDJXxO94qE7VbtJ7y718GZ",
//           urlLoad:
//             "http://173.249.14.149:3001/api/Dashboards/5ef370de14213070188a41eb/grapes?access_token=B6IES26pZSvpX4J8c8q4wmseASpRtmBOtvXzztH57NDDJXxO94qE7VbtJ7y718GZ",
//           autosave: false,
//           autoload: true,
//           contentTypeJson: true,
//           storeComponents: true,
//           allowScripts: 1,
//           storeStyles: true,
//           storeHtml: true,
//           storeCss: true
//         }
//       });

//       setEditor(e);
//     }
//   }, [editor]);

//   return <div id="g" className="h" />;
// };

// export default GrapesEditor;
