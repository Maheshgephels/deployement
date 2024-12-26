const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const moment = require('moment-timezone');
const ExcelJS = require('exceljs');
const verifyToken = require('../api/middleware/authMiddleware');
const excel = require('exceljs');






router.get('/getDropdownData', verifyToken, async (req, res) => {
    try {
        // Specify the columns you want to fetch from each table
        const facilitytype = ['cs_name', 'cs_facility_id', 'cs_display_name', 'cs_daywise'];
        const reg_cat = ['cs_reg_category', 'cs_reg_cat_id'];
        const work_cat = ['cs_workshop_name', 'cs_workshop_id'];
        const Userday_type = ['cs_reg_daytype_name', 'cs_reg_daytype_id'];
        const Scanday_type = ['cs_reg_daytype_name', 'cs_reg_daytype_id'];
        const field_data = ['cs_field_name', 'cs_field_label'];
        const scan_field_data = ['cs_field_name', 'cs_field_label'];

        const custom_data = ['cs_field_option', 'cs_field_option_value', 'cs_field_option_id', 'cs_field_id'];

        // Execute each query to fetch data from respective tables
        const [facilityData] = await pool.query(`SELECT ${facilitytype.join(',')} FROM cs_os_facilitytype WHERE cs_status = 1`);
        const [regCatData] = await pool.query(`SELECT ${reg_cat.join(',')} FROM cs_os_category WHERE cs_status = 1`);
        const [workshopData] = await pool.query(`SELECT ${work_cat.join(',')} FROM cs_os_workshop WHERE cs_status = 1`);
        const [ScandayTypeData] = await pool.query(`SELECT ${Scanday_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1 AND cs_reg_daytype_id <> 101;`);
        const [UserdayTypeData] = await pool.query(`SELECT ${Userday_type.join(',')} FROM cs_os_reg_daytype WHERE cs_status = 1 `);
        const [fieldsData] = await pool.query(`
            SELECT ${field_data.join(',')} 
            FROM cs_os_field_data 
            WHERE cs_status IN (1, 2) AND cs_visible_add_user = 1
            ORDER BY 
                CASE 
                    WHEN cs_status IN (1, 2) THEN cs_field_order 
                    ELSE 999999 
                END
        `);
        const [scanfieldsData] = await pool.query(`
            SELECT ${scan_field_data.join(', ')} 
            FROM cs_os_field_data 
            WHERE cs_field_id IN (1, 3, 4, 11)
        `);

        // Construct the response object
        const responseData = {
            facilityType: facilityData,
            regCategory: regCatData,
            workshop: workshopData,
            dayType: ScandayTypeData,
            UserdayType: UserdayTypeData,
            fields: fieldsData,
            scanfields: scanfieldsData
        };

        // console.log(fieldsData);

        // Send the response containing data from all queries
        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




// router.post('/createReport', async (req, res) => {
//     try {
//         // Extract fields from the request body
//         const { reportfield, category, eventday, facility, workshop, Reportname } = req.body;


//         // Extract the facility names from the nested array
//         const facilities = facility[0];

//         // Flatten the eventday array
//         const flattenedEventDays = eventday.flat();

//         // Array to store modified facilities with event day
//         const modifiedFacilities = [];

//         // Iterate over each facility and create separate entries for each event day
//         facilities.forEach(facilityName => {
//             flattenedEventDays.forEach(day => {
//                 modifiedFacilities.push(`cs_${facilityName}${day}`);
//             });
//         });

//         // Construct the SQL query string
//         let query = `
//         SELECT b.cs_regno, 
//                b.cs_date, 
//                b.cs_time, 
//                b.cs_deviceid, 
//                u.cs_first_name, 
//                u.cs_last_name, 
//                u.cs_reg_category
//         FROM cs_os_badgerecords AS b
//         INNER JOIN cs_os_users AS u ON b.cs_regno = u.cs_regno
//         WHERE b.cs_type IN (${modifiedFacilities.map(facility => `'${facility}'`).join(',')});
//         `;

//         // Execute the query
//         const [report] = await pool.query(query);

//         // Log the report data
//         console.log("Report Data:", report);

//         return res.status(200).json({ message: 'Report Created successfully' });

//     } catch (error) {
//         console.error('Error updating workshop:', error);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// });

router.get('/getScanData', verifyToken, async (req, res) => {
    try {
        // Construct the SQL query to fetch specific columns with pagination and search
        let query = `
                SELECT b.cs_regno, 
               b.cs_date, 
               b.cs_time, 
               b.cs_deviceid,
               b.cs_type, 
               u.cs_first_name, 
               u.cs_last_name, 
               u.cs_reg_category
        FROM cs_os_badgerecords as b
        INNER JOIN cs_os_users AS u ON b.cs_regno = u.cs_regno
        `;
        // Execute the query to fetch field data from the table
        const [userData] = await pool.query(query);

        let facquery = `
        SELECT cs_name, cs_display_name, cs_daywise
        FROM cs_os_facilitytype 
        WHERE cs_status != 2 
        `;
        // Execute the query to fetch field data from the table
        const [facilityData] = await pool.query(facquery);

        let dayquery = `
        SELECT *
        FROM cs_os_reg_daytype WHERE cs_status = 1 ORDER BY cs_reg_daytype_id ASC 
        `;
        // Execute the query to fetch field data from the table
        const [dayData] = await pool.query(dayquery);

        // Respond with JSON containing fetched data
        res.json({ userData, facilityData, dayData });
    } catch (error) {
        // Handle errors and respond with a 500 status code
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/createReport', verifyToken, async (req, res) => {
    try {
        // Extract fields from the request body
        const { reportfield, category, eventday, facility, workshop, Reportname, startDate, endDate } = req.body;

        // Flatten the eventday array
        const flattenedEventDays = eventday.flat();

        // Array to store modified facilities with event day
        const modifiedFacilities = [];

        // Iterate over each facility and create modified facility names for each event day
        facility.forEach(facilityName => {
            flattenedEventDays.forEach(day => {
                const modifiedFacility = `cs_${facilityName}${day}`;
                console.log(`Processing facility: ${facilityName}, Modified facility: ${modifiedFacility}`);
                modifiedFacilities.push(modifiedFacility);
            });
        });

        // Construct the SQL query string
        let query = `
        SELECT b.cs_regno, 
               b.cs_date, 
               b.cs_time, 
               b.cs_deviceid, 
               u.cs_first_name, 
               u.cs_last_name, 
               u.cs_reg_category
        FROM cs_os_badgerecords AS b
        INNER JOIN cs_os_users AS u ON b.cs_regno = u.cs_regno
        WHERE b.cs_type IN (${modifiedFacilities.map(facility => `'${facility}'`).join(',')}) AND b.cs_date BETWEEN ? AND ?;
        `;

        // Execute the query
        const [report] = await pool.query(query, [startDate, endDate]);

        // Create a new Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        // Add headers
        worksheet.addRow(['Registration Number', 'First Name', 'Last Name', 'Registration Category', 'Date', 'Time', 'Device ID']);

        // Add data rows
        report.forEach(row => {
            worksheet.addRow([row.cs_regno, row.cs_first_name, row.cs_last_name, row.cs_reg_category, row.cs_date, row.cs_time, row.cs_deviceid]);
        });

        // Generate the Excel file
        const buffer = await workbook.xlsx.writeBuffer();

        // Send the Excel file in the response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${Reportname}.xlsx"`);
        res.send(buffer);
    } catch (error) {
        console.error('Error generating report:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});



// router.post('/createUserReport', verifyToken, async (req, res) => {
//     try {
//         // Extract fields from the request body
//         const { reportfield, category, eventday, facility, workshop, Reportname } = req.body;

//         console.log(reportfield);

//         // Flatten the arrays
//         const flattenedEventDays = eventday.flat();
//         const flattenedCategory = category.flat();

//         // Construct the SQL query string
//         let query = `
//             SELECT *
//             FROM cs_os_users AS b
//             WHERE cs_reg_cat_id IN (${flattenedCategory.join(',')}) AND cs_reg_type IN (${flattenedEventDays.map(day => `'${day}'`).join(',')})
//             `;

//         // Execute the query
//         const [report] = await pool.query(query);

//         // Create a new Excel workbook
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Report');

//         // Add headers
//         worksheet.addRow(['Registration Number', 'First Name', 'Last Name', 'Registration Category', 'Registration Date', 'On Spot']);

//         // Add data rows
//         report.forEach(row => {
//             worksheet.addRow([row.cs_regno, row.cs_first_name, row.cs_last_name, row.cs_reg_category, row.cs_created_at, row.cs_onspot]);
//         });

//         // Generate the Excel file
//         const buffer = await workbook.xlsx.writeBuffer();

//         // Send the Excel file in the response
//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         res.setHeader('Content-Disposition', `attachment; filename="${Reportname}.xlsx"`);
//         res.send(buffer);
//     } catch (error) {
//         console.error('Error generating report:', error);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// });


router.post('/createUserReport', verifyToken, async (req, res) => {
    try {
        // Extract fields from the request body
        let { startDate, endDate, reportfield, category, eventday, facility, workshop, Reportname, startReg, endReg } = req.body;
        console.log(req.body);

        // Flatten the arrays
        const flattenedEventDays = eventday.flat();
        let flattenedCategory = category.flat();
        let flattenedReportFields = reportfield.flat();

        // Replace 'cs_reg_type' with 'cs_reg_daytype_name' in the report fields
        flattenedReportFields = flattenedReportFields.map(field =>
            field === 'cs_reg_type' ? 'cs_reg_daytype_name' : field
        );

        // Construct the SQL query string with a join to get cs_reg_daytype_name
        const timeZoneQuery = `
            SELECT cs_value 
            FROM cs_tbl_sitesetting 
            WHERE cs_parameter = 'Time Zone'
            LIMIT 1
        `;
        const timeZoneResult = await pool.query(timeZoneQuery);
        const timezone = timeZoneResult[0][0].cs_value;

        console.log("Timezone", timezone);

        // Properly format the categories array for SQL
        const categoryCondition = flattenedCategory.length > 0
            ? `cs_reg_cat_id IN (${flattenedCategory.map(cat => pool.escape(cat)).join(', ')})`
            : '1=1'; // If no category is provided, this prevents SQL errors.

        let query = `
            SELECT ${flattenedReportFields.map(field => {
            if (field === 'cs_reg_daytype_name') {
                return 'cs_os_reg_daytype.cs_reg_daytype_name';
            } else if (field === 'cs_workshop_category') {
                return 'cs_os_workshop.cs_workshop_name AS cs_workshop_category';
            } else {
                return `b.${field}`;
            }
        }).join(', ')}
            FROM cs_os_users AS b
            LEFT JOIN cs_os_reg_daytype ON cs_os_reg_daytype.cs_reg_daytype_id = b.cs_reg_type
            LEFT JOIN cs_os_workshop ON cs_os_workshop.cs_workshop_id = b.cs_workshop_category
            WHERE ${categoryCondition}
        `;

        // Apply filtering based on event days if provided, or fetch all
        if (flattenedEventDays.length > 0) {
            query += ` AND b.cs_reg_type IN (${flattenedEventDays.map(day => pool.escape(day)).join(', ')})`;
        }

        // Apply filtering based on workshops if provided
        // if (workshop && workshop.length > 0) {
        //     query += ` AND b.cs_workshop_category IN (${workshop.map(id => pool.escape(id)).join(', ')})`;
        // }
        if (workshop && workshop.length > 0) {
            // Fetch workshop types for the selected workshops
            const workshopTypeQuery = `
                SELECT cs_workshop_id, cs_workshop_name, cs_workshoptype_id	
                FROM cs_os_workshop
                WHERE cs_workshop_id IN (${workshop.map(id => pool.escape(id)).join(', ')})
            `;
            const [workshopTypes] = await pool.query(workshopTypeQuery);
            console.log('Selected Workshop Types:', workshopTypes);
        
            // Fetch related field names from cs_os_field_data
            const fieldDataQuery = `
                SELECT cs_field_name
                FROM cs_os_field_data
                WHERE cs_workshoptype_id IN (${workshopTypes.map(type => pool.escape(type.cs_workshoptype_id)).join(', ')})
            `;
            const [fieldData] = await pool.query(fieldDataQuery);
            console.log('Related Field Names:', fieldData);
        
            // Update the base query to match the fields with the selected workshops
            query += `
            AND (
                ${fieldData.map(field => `
                    b.${pool.escapeId(field.cs_field_name)} IN (${workshop.map(id => pool.escape(id)).join(', ')})
                `).join(' OR ')}
            )
        `;
        }
        

        // Apply the date range filters if provided
        if (startDate && endDate) {
            startDate = moment.tz(startDate, timezone).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            endDate = moment.tz(endDate, timezone).endOf('day').format('YYYY-MM-DD HH:mm:ss');
            query += ` AND b.created_at BETWEEN ${pool.escape(startDate)} AND ${pool.escape(endDate)}`;
        } else if (startDate) {
            query += ` AND b.created_at >= ${pool.escape(startDate)}`;
        } else if (endDate) {
            query += ` AND b.created_at <= ${pool.escape(endDate)}`;
        }

        // Apply registration number range if provided
        if (startReg != null && endReg != null) {
            query += ` AND b.cs_regno BETWEEN ${pool.escape(startReg)} AND ${pool.escape(endReg)}`;
        }

        // Log and execute the final query
        console.log('Generated SQL Query: ', query);
        const [report] = await pool.query(query);


        const fieldType13Query = `
        SELECT cs_field_name
        FROM cs_os_field_data
        WHERE cs_field_type = 13
    `;
    const [fieldsType13] = await pool.query(fieldType13Query);
    const dynamicWorkshopFields = fieldsType13.map(row => row.cs_field_name);

    // Replace workshop IDs with names dynamically
    for (let user of report) {
        for (let field of dynamicWorkshopFields) {
            if (user[field]) {
                const workshopQuery = `
                    SELECT cs_workshop_name
                    FROM cs_os_workshop
                    WHERE cs_workshop_id = ?
                `;
                const [workshopData] = await pool.query(workshopQuery, [user[field]]);
                if (workshopData.length > 0) {
                    user[field] = workshopData[0].cs_workshop_name; // Replace ID with name
                }
            }
        }
    }


        // Create a new Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        // Fetch field labels from the database
        const fieldLabelsQuery = `
            SELECT cs_field_name, cs_field_label
            FROM cs_os_field_data
            WHERE cs_field_name IN (${flattenedReportFields.map(field => pool.escape(field)).join(', ')})
        `;
        const [fieldLabels] = await pool.query(fieldLabelsQuery);

        // Extract the labels into an object for easy lookup
        const fieldLabelsMap = {};
        fieldLabels.forEach(field => {
            fieldLabelsMap[field.cs_field_name] = field.cs_field_label;
        });

        // Add the label for cs_reg_daytype_name
        fieldLabelsMap['cs_reg_daytype_name'] = 'Registration Type';
        fieldLabelsMap['cs_workshop_category'] = 'Workshop Category';

        // Add headers dynamically based on field labels
        const dynamicHeaders = flattenedReportFields.map(fieldName => fieldLabelsMap[fieldName]);
        worksheet.addRow(dynamicHeaders);

        // Add data rows
        // Add data rows
        report.forEach(row => {
            // Modify the value of cs_status before adding it to the row
            const status = row['cs_status'] === 1 ? 'Active' : 'Inactive';

            // Map other fields and adjust the created_at and updated_at fields to the dynamic timezone
            const rowData = flattenedReportFields.map(field => {
                if (field === 'cs_status') {
                    return status;
                } else if (field === 'created_at') {
                    // Convert created_at to the timezone fetched from the database
                    const createdAtInTimeZone = moment.tz(row['created_at'], timezone).format('YYYY-MM-DD HH:mm:ss');
                    return createdAtInTimeZone;
                } else if (field === 'updated_at') {
                    // Convert updated_at to the timezone fetched from the database
                    const updatedAtInTimeZone = moment.tz(row['updated_at'], timezone).format('YYYY-MM-DD HH:mm:ss');
                    return updatedAtInTimeZone;
                } else {
                    return row[field];
                }
            });

            worksheet.addRow(rowData);
        });


        // Generate the Excel file
        const buffer = await workbook.xlsx.writeBuffer();

        // Send the Excel file in the response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${Reportname}.xlsx"`);
        res.send(buffer);
    } catch (error) {
        console.error('Error generating report:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});




router.get('/samplefile', async (req, res) => {
    try {
        // Create a new workbook and add a worksheet
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sample');

        // Add the instructions and sample data to the worksheet
        // const data = [
        //     ['Import User Template'],
        //     [],
        //     ['How to import your data'],
        //     ['Step 1:', 'Collect all your attendee information and when you are ready, add your data to the Import sample sheet.'],
        //     ['Step 2:', 'Add your content; the columns mention in the mandatory section are required.'],
        //     ['Step 3:', 'When you are done adding your content, upload this file through the "Import" menu on Consoft Onsite admin (the same place where you downloaded this template).'],
        //     ['Step 4:', 'Your content will be automatically imported. If there are any errors you will be notified.'],
        //     [],
        //     ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
        //     [],
        //     ['TIP:', 'Users in the template can be in any order'],
        //     ['TIP:', 'Using Registration Category for your users? Make sure the Category already exist before using their id here.'],
        //     [],
        //     ['Column Name', 'Column Descriptions', 'Column Examples'],
        //     ['Registration number', 'The unique identifier for the user (do not delete or change this value)', '1023'],
        //     ['Title', 'The title for the user', 'Mr.'],
        //     ['First Name*', 'The first name (first name) of the user', 'John'],
        //     ['Last Name*', 'The last name (last name) of the user', 'Smith'],
        //     ['Registration Category', 'The Attendee Registration Category of the users', '1'],
        //     ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
        //     ['Company', 'The User Company Name', 'Socio'],
        //     ['Additional', 'Any Additional Question with value', 'X'],
        //     [],
        //     ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
        //     [],
        //     ['Registration Category', 'Value to need mention in import file']
        // ];

        // // Add data to worksheet
        // data.forEach((row, index) => {
        //     worksheet.addRow(row);
        //     if (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10 || index === 12 || index === 14) {
        //         worksheet.getRow(index + 1).font = { bold: true };
        //     }
        // });

        // Fetch registration categories from the database
        // const [categories] = await pool.query('SELECT cs_reg_category, cs_reg_cat_id FROM cs_os_category WHERE cs_status = 1 AND cs_show_onsite = 1');

        // // Add the registration categories to the worksheet
        // categories.forEach(category => {
        //     worksheet.addRow([category.cs_reg_category, category.cs_reg_cat_id]);
        // });

        // // Send the generated Excel file to the client
        // const [fieldData] = await pool.query(`
        //     SELECT cs_field_name, cs_visible_add_user 
        //     FROM cs_os_field_data 
        //     WHERE cs_field_name = 'cs_workshop_category' AND cs_visible_add_user = 1
        // `);

        // // If the condition is met, fetch workshop data
        // if (fieldData.length > 0) {
        //     const [workshops] = await pool.query('SELECT cs_workshop_id, cs_workshop_name FROM cs_os_workshop');
        //     // Add workshop data to worksheet
        //     worksheet.addRow([]);
        //     worksheet.addRow(['Workshop Name', 'Workshop ID']);
        //     workshops.forEach(workshop => {
        //         worksheet.addRow([workshop.cs_workshop_name, workshop.cs_workshop_id]);
        //     });
        // }

        // const [fieldData1] = await pool.query(`
        //     SELECT cs_field_name, cs_visible_add_user 
        //     FROM cs_os_field_data 
        //     WHERE cs_field_name = 'cs_reg_type' AND cs_visible_add_user = 1
        // `);

        // if (fieldData1.length > 0) {
        //     const [dayTypes] = await pool.query('SELECT cs_reg_daytype_id, cs_reg_daytype_name FROM cs_os_reg_daytype WHERE cs_status = 1');
        //     if (dayTypes.length > 0) {
        //         worksheet.addRow([]);
        //         worksheet.addRow(['Day Type Name', 'Day Type ID']);
        //         dayTypes.forEach(dayType => {
        //             worksheet.addRow([dayType.cs_reg_daytype_name, dayType.cs_reg_daytype_id]);
        //         });
        //     }
        // }

        // const [prefixes] = await pool.query('SELECT cs_prefix, cs_prefix_id FROM cs_os_name_prefixes');
        // if (prefixes.length > 0) {
        //     worksheet.addRow([]);
        //     worksheet.addRow(['Tittle', 'Tittle ID']);
        //     prefixes.forEach(prefix => {
        //         worksheet.addRow([prefix.cs_prefix, prefix.cs_prefix_id]);
        //     });
        // }

        const [dynamicFields] = await pool.query(`
        SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_add_user = 1 AND cs_status IN (1, 2) AND cs_field_id != 12 OR cs_field_id = 13
        ORDER BY 
                CASE 
                    WHEN cs_status IN (1, 2) THEN cs_field_order 
                    ELSE 999999 
                END;
`);

        const headerRow = dynamicFields.map(field => {
            return field.cs_field_label;
        });

        // Add the header row to the worksheet
        // worksheet.addRow([]);

        //         const [mandatoryfields] = await pool.query(`
        //         SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_add_user = 1 AND cs_is_required = 1 AND cs_field_id != 12 OR cs_field_id = 13;
        // `);

        //         worksheet.addRow(["Mandatory fields"]);

        //         mandatoryfields.forEach(field => {
        //             worksheet.addRow([field.cs_field_label]);
        //         });

        // worksheet.addRow([]);
        // worksheet.addRow([]);

        // worksheet.addRow(["Note- Before import file delete instructions Data"]).font = { color: { argb: 'FF0000' }, bold: true };
        worksheet.addRow(headerRow).font = { bold: true };



        // Send the generated Excel file to the client
        // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // res.setHeader('Content-Disposition', 'attachment; filename=sample.xlsx');

        const csvData = await workbook.csv.writeBuffer();

        // Send the generated CSV file to the client
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
        res.status(200).send(csvData);

        workbook.xlsx.write(res)
            .then(() => {
                res.end();
            })
            .catch(err => {
                console.error('Error generating sample Excel file:', err);
                res.status(500).send('Internal Server Error');
            });
    } catch (error) {
        console.error('Error fetching registration categories:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/importinstructionfilewithoutreg', async (req, res) => {
    try {
        // Create a new workbook and add a worksheet
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sample');

        // Add the instructions and sample data to the worksheet
        const data = [
            ['Import User Template'],
            [],
            ['How to import your data'],
            ['Step 1:', 'Collect all your attendee information and when you are ready, add your data to the Import sample sheet.'],
            ['Step 2:', 'Add your content; the columns mention in the mandatory section are required.'],
            ['Step 3:', 'When you are done adding your content, upload this file through the "Select File" menu on Consoft Onsite admin.'],
            ['Step 4:', 'Your content will be selected. If there are any errors you will be notified.'],
            [],
            ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
            ['NOTE:', 'If you are trying to add a Date, it should be in the "YYYY-MM-DD" format, e.g., 2024-11-22.'],
            [],
            ['TIP:', 'Users in the template can be in any order'],
            ['TIP:', 'Using Registration Category for your users? Make sure the Category already exist before using their id here.'],
            [],
            ['Column Name', 'Column Descriptions', 'Column Examples'],
            ['Registration number', 'The unique identifier for the user (do not delete or change this value)', '1023'],
            ['Title', 'The title for the user', 'Mr.'],
            ['First Name*', 'The first name (first name) of the user', 'John'],
            ['Last Name*', 'The last name (last name) of the user', 'Smith'],
            ['Registration Category', 'The Attendee Registration Category of the users', '1'],
            ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
            ['Company', 'The User Company Name', 'Socio'],
            ['Additional', 'Any Additional Question with value', 'X'],
            [],
            ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
            [],
            ['Registration Category', 'Value to need mention in import file']
        ];

        // Add data to worksheet
        data.forEach((row, index) => {
            worksheet.addRow(row);
            if (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10 || index === 12 || index === 14) {
                worksheet.getRow(index + 1).font = { bold: true };
            }
        });

        // Fetch registration categories from the database
        const [categories] = await pool.query('SELECT cs_reg_category, cs_reg_cat_id FROM cs_os_category WHERE cs_status = 1 AND cs_reg_cat_id NOT IN (0, 1, 3)');

        // Add the registration categories to the worksheet
        categories.forEach(category => {
            worksheet.addRow([category.cs_reg_category, category.cs_reg_cat_id]);
        });

        // Send the generated Excel file to the client
        // const [fieldData] = await pool.query(`
        //     SELECT cs_field_name, cs_visible_add_user 
        //     FROM cs_os_field_data 
        //     WHERE cs_field_name = 'cs_workshop_category' AND cs_visible_add_user = 1
        // `);

        // // If the condition is met, fetch workshop data
        // if (fieldData.length > 0) {
        //     const [workshops] = await pool.query('SELECT cs_workshop_id, cs_workshop_name FROM cs_os_workshop');
        //     // Add workshop data to worksheet
        //     worksheet.addRow([]);
        //     worksheet.addRow(['Workshop Name', 'Workshop ID']);
        //     workshops.forEach(workshop => {
        //         worksheet.addRow([workshop.cs_workshop_name, workshop.cs_workshop_id]);
        //     });
        // }
        const [workshopTypes] = await pool.query(`
            SELECT id, workshoptype_name 
            FROM cs_os_workshop_type 
            WHERE cs_status = 1
        `);

        // Loop over each workshop type and fetch associated workshops
        for (const type of workshopTypes) {

            // Add a new row for the workshop type name
            worksheet.addRow([]);
            worksheet.addRow([`Workshop Type: ${type.workshoptype_name}`]);

            // Fetch workshops related to this workshop type
            const [workshops] = await pool.query(`
                SELECT cs_workshop_id, cs_workshop_name 
                FROM cs_os_workshop 
                WHERE cs_workshoptype_id = ? AND  cs_status = 1
            `, [type.id]);

            // Check if there are workshops under the current type
            if (workshops.length > 0) {
                // Add headers for workshops under this type
                console.log(`Workshops for type ${type.workshoptype_name}:`, workshops);
                worksheet.addRow(['Workshop Name', 'Workshop ID']);
                workshops.forEach(workshop => {
                    worksheet.addRow([workshop.cs_workshop_name, workshop.cs_workshop_id]);
                });
            } else {
                // Add a note if no workshops are found for this type
                worksheet.addRow(['No workshops available for this type']);
            }
        }

        const [fieldData1] = await pool.query(`
            SELECT cs_field_name, cs_visible_add_user 
            FROM cs_os_field_data 
            WHERE cs_visible_add_user = 1 AND cs_status IN (1, 2)
        `);

        if (fieldData1.length > 0) {
            const [dayTypes] = await pool.query('SELECT cs_reg_daytype_id, cs_reg_daytype_name FROM cs_os_reg_daytype WHERE cs_status = 1');
            if (dayTypes.length > 0) {
                worksheet.addRow([]);
                worksheet.addRow(['Day Type Name', 'Day Type ID']);
                dayTypes.forEach(dayType => {
                    worksheet.addRow([dayType.cs_reg_daytype_name, dayType.cs_reg_daytype_id]);
                });
            }
        }

        const [prefixes] = await pool.query('SELECT cs_prefix, cs_prefix_id FROM cs_os_name_prefixes');
        if (prefixes.length > 0) {
            worksheet.addRow([]);
            worksheet.addRow(['Tittle', 'Tittle ID']);
            prefixes.forEach(prefix => {
                worksheet.addRow([prefix.cs_prefix, prefix.cs_prefix_id]);
            });
        }

        const [dynamicFields] = await pool.query(`
        SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_add_user = 1 AND cs_status IN (1, 2) AND cs_field_id != 12 OR cs_field_id = 13
        ORDER BY 
                CASE 
                    WHEN cs_status IN (1, 2) THEN cs_field_order 
                    ELSE 999999 
                END;
`);

        const headerRow = dynamicFields.map(field => {
            return field.cs_field_label;
        });

        // Add the header row to the worksheet
        worksheet.addRow([]);

        const [mandatoryfields] = await pool.query(`
        SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_add_user = 1 AND cs_status IN (1, 2) AND  cs_is_required = 1 AND cs_field_id != 12 OR cs_field_id = 13;
`);

        worksheet.addRow(["Mandatory fields"]);

        mandatoryfields.forEach(field => {
            worksheet.addRow([field.cs_field_label]);
        });

        worksheet.addRow([]);
        worksheet.addRow([]);

        // worksheet.addRow(["Note- Before import file delete instructions Data"]).font = { color: { argb: 'FF0000' }, bold: true };
        // worksheet.addRow(headerRow).font = { bold: true };



        // Send the generated Excel file to the client
        // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // res.setHeader('Content-Disposition', 'attachment; filename=sample.xlsx');

        const csvData = await workbook.csv.writeBuffer();

        // Send the generated CSV file to the client
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
        res.status(200).send(csvData);

        workbook.xlsx.write(res)
            .then(() => {
                res.end();
            })
            .catch(err => {
                console.error('Error generating sample Excel file:', err);
                res.status(500).send('Internal Server Error');
            });
    } catch (error) {
        console.error('Error fetching registration categories:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/samplefilewithregistrationnum', async (req, res) => {
    try {
        // Create a new workbook and add a worksheet
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sample');

        // Add the instructions and sample data to the worksheet
        const data = [
            // ['Import User Template'],
            // [],
            // ['How to import your data'],
            // ['Step 1:', 'Collect all your attendee information and when you are ready, add your data to the Import sample sheet.'],
            // ['Step 2:', 'Add your content; the columns mention in the mandatory section are required.'],
            // ['Step 3:', 'When you are done adding your content, upload this file through the "Import" menu on Consoft Onsite admin (the same place where you downloaded this template).'],
            // ['Step 4:', 'Your content will be automatically imported. If there are any errors you will be notified.'],
            // [],
            // ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
            // [],
            // ['TIP:', 'Users in the template can be in any order'],
            // ['TIP:', 'Using Registration Category for your users? Make sure the Category already exist before using their id here.'],
            // [],
            // ['Column Name', 'Column Descriptions', 'Column Examples'],
            // ['Registration number', 'The unique identifier for the user (do not delete or change this value)', '1023'],
            // ['Title', 'The title for the user', 'Mr.'],
            // ['First Name*', 'The first name (first name) of the user', 'John'],
            // ['Last Name*', 'The last name (last name) of the user', 'Smith'],
            // ['Registration Category', 'The Attendee Registration Category of the users', '1'],
            // ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
            // ['Company', 'The User Company Name', 'Socio'],
            // ['Additional', 'Any Additional Question with value', 'X'],
            // [],
            // ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
            // [],
            // ['Registration Category', 'Value to need mention in import file']
        ];

        // Add data to worksheet
        // data.forEach((row, index) => {
        //     worksheet.addRow(row);
        //     if (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10 || index === 12 || index === 14) {
        //         worksheet.getRow(index + 1).font = { bold: true };
        //     }
        // });

        // Fetch registration categories from the database
        const [categories] = await pool.query('SELECT cs_reg_category, cs_reg_cat_id FROM cs_os_category WHERE cs_status = 1 AND cs_reg_cat_id NOT IN (0, 1, 3)');

        // Add the registration categories to the worksheet
        // categories.forEach(category => {
        //     worksheet.addRow([category.cs_reg_category, category.cs_reg_cat_id]);
        // });

        // Send the generated Excel file to the client
        const [fieldData] = await pool.query(`
            SELECT cs_field_name, cs_visible_add_user 
            FROM cs_os_field_data 
            WHERE cs_field_name = 'cs_workshop_category' AND cs_visible_add_user = 1
        `);

        // If the condition is met, fetch workshop data
        // if (fieldData.length > 0) {
        //     const [workshops] = await pool.query('SELECT cs_workshop_id, cs_workshop_name FROM cs_os_workshop');
        //     // Add workshop data to worksheet
        //     worksheet.addRow([]);
        //     worksheet.addRow(['Workshop Name', 'Workshop ID']);
        //     workshops.forEach(workshop => {
        //         worksheet.addRow([workshop.cs_workshop_name, workshop.cs_workshop_id]);
        //     });
        // }

        const [fieldData1] = await pool.query(`
            SELECT cs_field_name, cs_visible_add_user 
            FROM cs_os_field_data 
            WHERE cs_field_name = 'cs_reg_type' AND cs_visible_add_user = 1
        `);

        // if (fieldData1.length > 0) {
        //     const [dayTypes] = await pool.query('SELECT cs_reg_daytype_id, cs_reg_daytype_name FROM cs_os_reg_daytype WHERE cs_status = 1');
        //     if (dayTypes.length > 0) {
        //         worksheet.addRow([]);
        //         worksheet.addRow(['Day Type Name', 'Day Type ID']);
        //         dayTypes.forEach(dayType => {
        //             worksheet.addRow([dayType.cs_reg_daytype_name, dayType.cs_reg_daytype_id]);
        //         });
        //     }
        // }

        // const [prefixes] = await pool.query('SELECT cs_prefix, cs_prefix_id FROM cs_os_name_prefixes');
        // if (prefixes.length > 0) {
        //     worksheet.addRow([]);
        //     worksheet.addRow(['Tittle', 'Tittle ID']);
        //     prefixes.forEach(prefix => {
        //         worksheet.addRow([prefix.cs_prefix, prefix.cs_prefix_id]);
        //     });
        // }

        const [dynamicFields] = await pool.query(`
        SELECT cs_field_label, cs_is_required
        FROM cs_os_field_data 
        WHERE cs_visible_add_user = 1 AND cs_status IN (1, 2) AND cs_field_id != 12 OR cs_field_id = 13 
            ORDER BY 
                CASE 
                    WHEN cs_status IN (1, 2) THEN cs_field_order 
                    ELSE 999999 
                END
    `);

        const headerRow = [
            'Registration Number',
            ...dynamicFields.map(field => `${field.cs_field_label}`)
        ];




        // Add the header row to the worksheet
        // worksheet.addRow([]);

        const [mandatoryfields] = await pool.query(`
        SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_add_user = 1 AND cs_status IN (1, 2) AND cs_is_required = 1 AND cs_field_id != 12 OR cs_field_id = 13;
`);

        // worksheet.addRow(["Mentory fields"]);
        // worksheet.addRow(["Registration Number"]);
        // mandatoryfields.forEach(field => {
        //     worksheet.addRow([field.cs_field_label]);
        // });

        // worksheet.addRow([]);
        // worksheet.addRow([]);

        // worksheet.addRow(["Note- Before import file delete instructions Data"]).font = { color: { argb: 'FF0000' }, bold: true };
        worksheet.addRow(headerRow).font = { bold: true };



        // Send the generated Excel file to the client
        // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // res.setHeader('Content-Disposition', 'attachment; filename=sample.xlsx');

        const csvData = await workbook.csv.writeBuffer();

        // Send the generated CSV file to the client
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
        res.status(200).send(csvData);

        workbook.xlsx.write(res)
            .then(() => {
                res.end();
            })
            .catch(err => {
                console.error('Error generating sample Excel file:', err);
                res.status(500).send('Internal Server Error');
            });
    } catch (error) {
        console.error('Error fetching registration categories:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/importinstructionfile', async (req, res) => {
    try {
        // Create a new workbook and add a worksheet
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sample');

        // Add the instructions and sample data to the worksheet
        const data = [
            ['Import User Template'],
            [],
            ['How to import your data'],
            ['Step 1:', 'Collect all your attendee information and when you are ready, add your data to the Import sample sheet.'],
            ['Step 2:', 'Add your content; the columns mention in the mandatory section are required.'],
            ['Step 3:', 'When you are done adding your content, upload this file through the "Select File" menu on Consoft Onsite admin.'],
            ['Step 4:', 'Your content will be selected. If there are any errors you will be notified.'],
            [],
            ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
            ['NOTE:', 'If you are trying to add a Date, it should be in the "YYYY-MM-DD" format, e.g., 2024-11-22.'],
            [],
            ['TIP:', 'Users in the template can be in any order'],
            ['TIP:', 'Using Registration Category for your users? Make sure the Category already exist before using their id here.'],
            [],
            ['Column Name', 'Column Descriptions', 'Column Examples'],
            ['Registration number', 'The unique identifier for the user (do not delete or change this value)', '1023'],
            ['Title', 'The title for the user', 'Mr.'],
            ['First Name*', 'The first name (first name) of the user', 'John'],
            ['Last Name*', 'The last name (last name) of the user', 'Smith'],
            ['Registration Category', 'The Attendee Registration Category of the users', '1'],
            ['Email', 'The email address the attendee used to register for the event.', 'dummy@gmail.com'],
            ['Company', 'The User Company Name', 'Socio'],
            ['Additional', 'Any Additional Question with value', 'X'],
            [],
            ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
            [],
            ['Registration Category', 'Value to need mention in import file']
        ];

        // Add data to worksheet
        data.forEach((row, index) => {
            worksheet.addRow(row);
            if (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10 || index === 12 || index === 14) {
                worksheet.getRow(index + 1).font = { bold: true };
            }
        });

        // Fetch registration categories from the database
        const [categories] = await pool.query('SELECT cs_reg_category, cs_reg_cat_id FROM cs_os_category WHERE cs_status = 1 AND cs_reg_cat_id NOT IN (0, 1, 3)');

        // Add the registration categories to the worksheet
        categories.forEach(category => {
            worksheet.addRow([category.cs_reg_category, category.cs_reg_cat_id]);
        });

        // Send the generated Excel file to the client
        // const [fieldData] = await pool.query(`
        //     SELECT cs_field_name, cs_visible_add_user 
        //     FROM cs_os_field_data 
        //     WHERE cs_field_name = 'cs_workshop_category' AND cs_visible_add_user = 1
        // `);

        // // If the condition is met, fetch workshop data
        // if (fieldData.length > 0) {
        //     const [workshops] = await pool.query('SELECT cs_workshop_id, cs_workshop_name FROM cs_os_workshop');
        //     // Add workshop data to worksheet
        //     worksheet.addRow([]);
        //     worksheet.addRow(['Workshop Name', 'Workshop ID']);
        //     workshops.forEach(workshop => {
        //         worksheet.addRow([workshop.cs_workshop_name, workshop.cs_workshop_id]);
        //     });
        // }

        // Fetch workshop types with cs_status = 1




        const [fieldData] = await pool.query(`
            SELECT cs_field_name, cs_visible_add_user 
            FROM cs_os_field_data 
            WHERE cs_visible_add_user = 1 AND cs_status IN (1, 2)
        `);

        if (fieldData.length > 0) {
            const [dayTypes] = await pool.query('SELECT cs_reg_daytype_id, cs_reg_daytype_name FROM cs_os_reg_daytype WHERE cs_status = 1');
            if (dayTypes.length > 0) {
                worksheet.addRow([]);
                worksheet.addRow(['Day Type Name', 'Day Type ID']);
                dayTypes.forEach(dayType => {
                    worksheet.addRow([dayType.cs_reg_daytype_name, dayType.cs_reg_daytype_id]);
                });
            }
        }

        const [prefixes] = await pool.query('SELECT cs_prefix, cs_prefix_id FROM cs_os_name_prefixes');
        if (prefixes.length > 0) {
            worksheet.addRow([]);
            worksheet.addRow(['Tittle', 'Tittle ID']);
            prefixes.forEach(prefix => {
                worksheet.addRow([prefix.cs_prefix, prefix.cs_prefix_id]);
            });
        }

        const [dynamicFields] = await pool.query(`
        SELECT cs_field_label, cs_is_required
        FROM cs_os_field_data 
        WHERE cs_visible_add_user = 1 AND cs_status IN (1, 2) AND cs_field_id != 12 OR cs_field_id = 13
            ORDER BY 
                CASE 
                    WHEN cs_status IN (1, 2) THEN cs_field_order 
                    ELSE 999999 
                END
    `);


        const [workshopTypes] = await pool.query(`
        SELECT id, workshoptype_name 
        FROM cs_os_workshop_type 
        WHERE cs_status = 1
    `);

        // Loop over each workshop type and fetch associated workshops
        for (const type of workshopTypes) {

            // Add a new row for the workshop type name
            worksheet.addRow([]);
            worksheet.addRow([`Workshop Type: ${type.workshoptype_name}`]);

            // Fetch workshops related to this workshop type
            const [workshops] = await pool.query(`
            SELECT cs_workshop_id, cs_workshop_name 
            FROM cs_os_workshop 
            WHERE cs_workshoptype_id = ? AND  cs_status = 1
        `, [type.id]);

            // Check if there are workshops under the current type
            if (workshops.length > 0) {
                // Add headers for workshops under this type
                console.log(`Workshops for type ${type.workshoptype_name}:`, workshops);
                worksheet.addRow(['Workshop Name', 'Workshop ID']);
                workshops.forEach(workshop => {
                    worksheet.addRow([workshop.cs_workshop_name, workshop.cs_workshop_id]);
                });
            } else {
                // Add a note if no workshops are found for this type
                worksheet.addRow(['No workshops available for this type']);
            }
        }

        // const headerRow = [
        //     'Registration Number',
        //     ...dynamicFields.map(field => `${field.cs_field_label}`)
        // ];




        // Add the header row to the worksheet
        worksheet.addRow([]);

        const [mandatoryfields] = await pool.query(`
        SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_add_user = 1 AND cs_status IN (1, 2) AND cs_is_required = 1 AND cs_field_id != 12 OR cs_field_id = 13;
`);

        worksheet.addRow(["Mandatory fields"]);
        worksheet.addRow(["Registration Number"]);
        mandatoryfields.forEach(field => {
            worksheet.addRow([field.cs_field_label]);
        });

        worksheet.addRow([]);
        worksheet.addRow([]);

        // worksheet.addRow(["Note- Before import file delete instructions Data"]).font = { color: { argb: 'FF0000' }, bold: true };
        // worksheet.addRow(headerRow).font = { bold: true };



        // Send the generated Excel file to the client
        // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // res.setHeader('Content-Disposition', 'attachment; filename=sample.xlsx');

        const csvData = await workbook.csv.writeBuffer();

        // Send the generated CSV file to the client
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
        res.status(200).send(csvData);

        workbook.xlsx.write(res)
            .then(() => {
                res.end();
            })
            .catch(err => {
                console.error('Error generating sample Excel file:', err);
                res.status(500).send('Internal Server Error');
            });
    } catch (error) {
        console.error('Error fetching registration categories:', error);
        res.status(500).send('Internal Server Error');
    }

});

router.get('/importinstructionfileforblankdata', async (req, res) => {
    try {
        // Create a new workbook and add a worksheet
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sample');

        // Add the instructions and sample data to the worksheet
        const data = [
            ['Import Blank Badge Data  Template'],
            [],
            ['How to import your data'],
            ['Step 1:', 'Collect all your  information and when you are ready, add your registration number and category ID  to the Import sample sheet.'],
            ['Step 2:', 'Add your content; the columns mention in the mandatory section are required.'],
            ['Step 3:', 'When you are done adding your content, upload this file through the "Select File" menu on Consoft Onsite admin.'],
            ['Step 4:', 'Your content will be selected. If there are any errors you will be notified.'],
            [],
            ['NOTE:', "Don't delete any columns from the sample sheet. If you aren't using a column, just leave it empty."],
            ['NOTE:', 'If you are trying to add a Date, it should be in the "YYYY-MM-DD" format, e.g., 2024-11-22.'],
            [],
            ['TIP:', 'Users in the template can be in any order'],
            ['TIP:', 'Using Registration Category for your users? Make sure the Category already exist before using their id here.'],
            [],
            ['Column Name', 'Column Descriptions', 'Column Examples'],
            ['Registration number', 'The unique identifier for the user (do not delete or change this value)', '1023'],
            ['Registration Category', 'The Value Registration Category of the users']
            ['Questions?', 'If you have any questions or problems uploading your data, email us on info@consoftservices.com'],
            [],
            ['Registration Category', 'Value to need mention in import file']


        ];

        // Add data to worksheet
        data.forEach((row, index) => {
            worksheet.addRow(row);
            if (index === 0 || index === 2 || index === 4 || index === 6 || index === 8 || index === 10 || index === 12 || index === 14) {
                worksheet.getRow(index + 1).font = { bold: true };
            }
        });

        // Fetch registration categories from the database
        const [categories] = await pool.query('SELECT cs_reg_category, cs_reg_cat_id FROM cs_os_category WHERE cs_status = 1 AND cs_reg_cat_id NOT IN (0, 1, 3)');

        // Add the registration categories to the worksheet
        categories.forEach(category => {
            worksheet.addRow([category.cs_reg_category, category.cs_reg_cat_id]);
        });

        // Send the generated Excel file to the client
        const [fieldData] = await pool.query(`
            SELECT cs_field_name, cs_visible_add_user 
            FROM cs_os_field_data 
            WHERE cs_field_name = 'cs_workshop_category' AND cs_visible_add_user = 1
        `);

        // If the condition is met, fetch workshop data
        // if (fieldData.length > 0) {
        //     const [workshops] = await pool.query('SELECT cs_workshop_id, cs_workshop_name FROM cs_os_workshop');
        //     // Add workshop data to worksheet
        //     worksheet.addRow([]);
        //     worksheet.addRow(['Workshop Name', 'Workshop ID']);
        //     workshops.forEach(workshop => {
        //         worksheet.addRow([workshop.cs_workshop_name, workshop.cs_workshop_id]);
        //     });
        // }

        const [fieldData1] = await pool.query(`
            SELECT cs_field_name, cs_visible_add_user 
            FROM cs_os_field_data 
            WHERE cs_visible_add_user = 1 AND cs_status IN (1, 2)
        `);

        if (fieldData1.length > 0) {
            const [dayTypes] = await pool.query('SELECT cs_reg_daytype_id, cs_reg_daytype_name FROM cs_os_reg_daytype WHERE cs_status = 1');
            if (dayTypes.length > 0) {
                worksheet.addRow([]);
                worksheet.addRow(['Day Type Name', 'Day Type ID']);
                dayTypes.forEach(dayType => {
                    worksheet.addRow([dayType.cs_reg_daytype_name, dayType.cs_reg_daytype_id]);
                });
            }
        }

        // const [prefixes] = await pool.query('SELECT cs_prefix, cs_prefix_id FROM cs_os_name_prefixes');
        // if (prefixes.length > 0) {
        //     worksheet.addRow([]);
        //     worksheet.addRow(['Tittle', 'Tittle ID']);
        //     prefixes.forEach(prefix => {
        //         worksheet.addRow([prefix.cs_prefix, prefix.cs_prefix_id]);
        //     });
        // }

        const [dynamicFields] = await pool.query(`
        SELECT cs_field_label, cs_is_required
        FROM cs_os_field_data 
        WHERE cs_visible_add_user = 1 AND cs_status IN (1, 2) AND cs_field_id != 12 OR cs_field_id = 13
            ORDER BY 
                CASE 
                    WHEN cs_status IN (1, 2) THEN cs_field_order 
                    ELSE 999999 
                END
    `);

        // const headerRow = [
        //     'Registration Number',
        //     ...dynamicFields.map(field => `${field.cs_field_label}`)
        // ];




        // Add the header row to the worksheet
        worksheet.addRow([]);

        //         const [mandatoryfields] = await pool.query(`
        //         SELECT cs_field_label, cs_is_required FROM cs_os_field_data WHERE cs_visible_add_user = 1 AND cs_is_required = 1 AND cs_field_id != 12 OR cs_field_id = 13;
        // `);
        const [mandatoryfields] = await pool.query(`
            SELECT cs_field_label 
            FROM cs_os_field_data 
            WHERE cs_visible_add_user = 1 AND cs_status IN (1, 2)
            AND cs_field_id IN (12, 15);
        `);


        worksheet.addRow(["Mandatory fields"]);
        worksheet.addRow(["Registration Number"]);
        mandatoryfields.forEach(field => {
            worksheet.addRow([field.cs_field_label]);
        });

        worksheet.addRow([]);
        worksheet.addRow([]);

        // worksheet.addRow(["Note- Before import file delete instructions Data"]).font = { color: { argb: 'FF0000' }, bold: true };
        // worksheet.addRow(headerRow).font = { bold: true };



        // Send the generated Excel file to the client
        // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // res.setHeader('Content-Disposition', 'attachment; filename=sample.xlsx');

        const csvData = await workbook.csv.writeBuffer();

        // Send the generated CSV file to the client
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sample.csv');
        res.status(200).send(csvData);

        workbook.xlsx.write(res)
            .then(() => {
                res.end();
            })
            .catch(err => {
                console.error('Error generating sample Excel file:', err);
                res.status(500).send('Internal Server Error');
            });
    } catch (error) {
        console.error('Error fetching registration categories:', error);
        res.status(500).send('Internal Server Error');
    }

});







module.exports = router;