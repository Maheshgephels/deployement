const express = require('express');
const router = express.Router();
const {pool} = require('../../config/database'); // Import the database pool

const verifyToken = require('./middleware/authMiddleware');

router.get('/widgetdata', verifyToken, async (req, res) => {
  try {
    // Query to fetch categories and their counts from cs_users table
    const categoryQuery = `
    SELECT 
        c.cs_reg_category AS title, 
        COUNT(u.cs_reg_category) AS total,
        SUM(CASE WHEN u.cs_onspot = 'Yes' THEN 1 ELSE 0 END) AS onspot_total,
        c.cs_reg_cat_id AS catID
    FROM cs_os_category c
    LEFT JOIN cs_os_users u 
        ON u.cs_reg_cat_id = c.cs_reg_cat_id 
        AND u.cs_isconfirm = 1 -- Move the condition to the JOIN clause
    WHERE c.cs_status = 1 
    GROUP BY c.cs_reg_category, c.cs_reg_cat_id
    ORDER BY c.cs_reg_cat_id;
    `;

    // Execute the category query using promises
    const [categoryResult] = await pool.query(categoryQuery);

    // Format the category result to match the structure of widget data
    let widgetData = categoryResult.map(row => ({
      title: row.title,
      total: row.total.toString(), // Convert count to string
      onspot_total: row.onspot_total.toString(), // Convert onspot count to string
      color: 'secondary', // Example color
      icon: 'course-1', // Example icon
      catID: row.catID // Example icon
    }));

    // Query to fetch the total count of onspot users from cs_users table
    const totalOnspotQuery = `SELECT COUNT(*) AS totalOnspot FROM cs_os_users WHERE cs_onspot = 'Yes' AND cs_isconfirm = 1;`;

    // Execute the total onspot count query
    const [totalOnspotResult] = await pool.query(totalOnspotQuery);

    // Extract the total onspot count from the result
    const totalOnspotCount = totalOnspotResult[0].totalOnspot;

    // Calculate the total count
    const totalCount = categoryResult.reduce((acc, cur) => acc + cur.total, 0);

    // Append the total count and onspot total count widgets to the result
    widgetData.unshift({
      title: 'Total',
      total: totalCount.toString(),
      onspot_total: totalOnspotCount.toString(),
      color: 'primary',
      icon: 'course-1'
    });
    widgetData.unshift({
      title: 'Onspot',
      total: totalOnspotCount.toString(),
      color: 'primary',
      icon: 'course-1',
      catID: 'Yes'
    });

    // Send the widget data as response
    res.json(widgetData);
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});


router.get('/eventWidgetData',verifyToken, async (req, res) => {
  try {
    // Query to fetch categories and their counts from cs_users table
    const categoryQuery = `
    SELECT 
        c.cs_reg_category AS title, 
        COUNT(u.cs_reg_category) AS total,
        c.cs_reg_cat_id AS catID
        FROM cs_os_category c
        LEFT JOIN cs_os_users u ON u.cs_reg_cat_id = c.cs_reg_cat_id
        WHERE c.cs_status = 1 
        GROUP BY c.cs_reg_category, c.cs_reg_cat_id
        ORDER BY c.cs_reg_cat_id;
    `;

    // Execute the category query using promises
    const [categoryResult] = await pool.query(categoryQuery);

    // Format the category result to match the structure of widget data
    let widgetData = categoryResult.map(row => ({
      title: row.title,
      total: row.total.toString(), // Convert count to string
      // onspot_total: row.onspot_total.toString(), // Convert onspot count to string
      color: 'secondary', // Example color
      icon: 'course-1', // Example icon
      catID: row.catID // Example icon
    }));

    // // Query to fetch the total count of onspot users from cs_users table
    // const totalOnspotQuery = `SELECT COUNT(*) AS totalOnspot FROM cs_os_users WHERE cs_onspot = 'Yes' AND cs_isconfirm = 1;`;

    // // Execute the total onspot count query
    // const [totalOnspotResult] = await pool.query(totalOnspotQuery);

    // // Extract the total onspot count from the result
    // const totalOnspotCount = totalOnspotResult[0].totalOnspot;

    // // Calculate the total count
    // const totalCount = categoryResult.reduce((acc, cur) => acc + cur.total, 0);

    // // Append the total count and onspot total count widgets to the result
    // widgetData.unshift({
    //   title: 'Total',
    //   total: totalCount.toString(),
    //   onspot_total: totalOnspotCount.toString(),
    //   color: 'primary',
    //   icon: 'course-1'
    // });
    // widgetData.unshift({
    //   title: 'Onspot',
    //   total: totalOnspotCount.toString(),
    //   color: 'primary',
    //   icon: 'course-1',
    //   catID: 'Yes'
    // });

    // Send the widget data as response
    res.json(widgetData);
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});


router.get('/regWidgetData',verifyToken, async (req, res) => {
  try {
    // Query to fetch categories and their counts from cs_users table
    const categoryQuery = `
    SELECT 
        c.cs_reg_category AS title, 
        COUNT(u.cs_reg_category) AS total,
        c.cs_reg_cat_id AS catID
        FROM cs_os_category c
        LEFT JOIN cs_os_users u ON u.cs_reg_cat_id = c.cs_reg_cat_id
        WHERE c.cs_status = 1 
        GROUP BY c.cs_reg_category, c.cs_reg_cat_id
        ORDER BY c.cs_reg_cat_id;
    `;

    // Execute the category query using promises
    const [categoryResult] = await pool.query(categoryQuery);

    // Format the category result to match the structure of widget data
    let widgetData = categoryResult.map(row => ({
      title: row.title,
      total: row.total.toString(), // Convert count to string
      // onspot_total: row.onspot_total.toString(), // Convert onspot count to string
      color: 'secondary', // Example color
      icon: 'course-1', // Example icon
      catID: row.catID // Example icon
    }));

    // // Query to fetch the total count of onspot users from cs_users table
    // const totalOnspotQuery = `SELECT COUNT(*) AS totalOnspot FROM cs_os_users WHERE cs_onspot = 'Yes' AND cs_isconfirm = 1;`;

    // // Execute the total onspot count query
    // const [totalOnspotResult] = await pool.query(totalOnspotQuery);

    // // Extract the total onspot count from the result
    // const totalOnspotCount = totalOnspotResult[0].totalOnspot;

    // // Calculate the total count
    // const totalCount = categoryResult.reduce((acc, cur) => acc + cur.total, 0);

    // // Append the total count and onspot total count widgets to the result
    // widgetData.unshift({
    //   title: 'Total',
    //   total: totalCount.toString(),
    //   onspot_total: totalOnspotCount.toString(),
    //   color: 'primary',
    //   icon: 'course-1'
    // });
    // widgetData.unshift({
    //   title: 'Onspot',
    //   total: totalOnspotCount.toString(),
    //   color: 'primary',
    //   icon: 'course-1',
    //   catID: 'Yes'
    // });

    // Send the widget data as response
    res.json(widgetData);
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});


router.get('/widgetdataWithPercent', verifyToken, async (req, res) => {
  try {
    // Query to fetch counts for all facilities from cs_os_facility_detail table
    const query = `
    SELECT 
    fd.cs_facility_name AS title, fd.cs_facility_id,
    SUM(CASE WHEN br.cs_type IS NOT NULL THEN 1 ELSE 0 END) AS total, 
    cs_logo_image_url AS logo,
    fd.cs_facility_name AS facilityType
  FROM 
    cs_os_facility_detail fd 
  LEFT JOIN 
    cs_os_badgerecords br ON fd.cs_facility_name = br.cs_type 
    LEFT JOIN 
    cs_os_facilitytype ft ON fd.cs_facility_id = ft.cs_facility_id
  WHERE 
    fd.cs_status = 1 AND ft.cs_status = 1
  GROUP BY 
    fd.cs_facility_name, ft.cs_facility_id
    ORDER BY fd.cs_facility_detail_id
    `;

    // Execute the query using promises
    const [result] = await pool.query(query);

    // Create an array to store promises for sum queries
    const sumQueriesPromises = result.map(row => {
      // const cs_sumQuery = `
      //   SELECT SUM(CAST(JSON_EXTRACT(cs_badge_data, '$.${row.facilityType}') AS UNSIGNED)) AS cs_sum
      //   FROM cs_os_badges
      //   WHERE JSON_EXTRACT(cs_badge_data, '$.${row.facilityType}') != '0';
      // `;
      const cs_sumQuery = `
      SELECT SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(cs_badge_data, '$.${row.facilityType}')) AS UNSIGNED)) AS cs_sum
FROM cs_os_badges
WHERE JSON_UNQUOTE(JSON_EXTRACT(cs_badge_data, '$.${row.facilityType}')) != '0';
     `;
      return pool.query(cs_sumQuery);
    });

    // Execute all sum queries concurrently
    const sumResults = await Promise.all(sumQueriesPromises);

    // Format the result to match the structure of widget data
    const DataWidgetWithPercentage = result.map((row, index) => {
      let title = row.title.replace(/^cs_/, ''); // Remove 'cs_' prefix
      if (/\d$/.test(title)) {
        title = title.replace(/(\d+)$/, ' Day $1'); // Append 'Day' to titles ending with a number
      }
    
      const total = row.total ? row.total.toString() : '0'; // Handle null total counts
      let logo = row.logo;
      let TotalAllowCount = '0'; // Default value for TotalAllowCount
      if (sumResults[index][0][0]) {
        TotalAllowCount = sumResults[index][0][0].cs_sum ? sumResults[index][0][0].cs_sum.toString() : '0';
      }
          
    // Calculate the percentage
    const percentage = total && TotalAllowCount && parseFloat(TotalAllowCount) !== 0
    ? ((parseFloat(total) / parseFloat(TotalAllowCount)) * 100).toFixed(2)
    : "0.00";
  

          return {
            facilityType: row.facilityType,
            title: title,
            image: logo,
            total: total,
            TotalAllowCount: TotalAllowCount,
            color: 'secondary', // Example color
            chart: {
              color: ["var(--theme-default)"],
              series: [percentage], // Pass the percentage value to series parameter
            },
          };
        });
        
        // Send the widget data as response
        res.json(DataWidgetWithPercentage);
      } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
      }
    });

    
    router.get('/widgetdatachart', verifyToken, async (req, res) => {
      try {
        // Query to fetch counts for all facilities from cs_os_facility_detail table
        const query = `
          SELECT 
            fd.cs_facility_name AS title, 
            SUM(CASE WHEN br.cs_type IS NOT NULL THEN 1 ELSE 0 END) AS total, 
            fd.cs_facility_name AS facilityType
          FROM 
            cs_os_facility_detail fd 
          LEFT JOIN 
            cs_os_badgerecords br ON fd.cs_facility_name = br.cs_type 
          WHERE 
            fd.cs_status = 1 
          GROUP BY 
            fd.cs_facility_name;
        `;
    
        // Execute the query using promises
        const [result] = await pool.query(query);
    
        // Reduce the result into day-wise facility objects
        const marketChartData = result.reduce((acc, row) => {
          let title = row.title.replace(/^cs_/, ''); // Remove 'cs_' prefix
          if (/\d$/.test(title)) {
            title = title.replace(/(\d+)$/, ' Day $1'); // Append 'Day' to titles ending with a number
          }
    
          const total = row.total ? row.total.toString() : '0'; // Handle null total counts
    
          const facility = {
            facilityType: row.facilityType.replace(/^cs_/, ''), // Remove 'cs_' prefix from facilityType
            title: title,
            total: total,
          };
    
          // Extract the day from the title
          const dayMatch = title.match(/Day (\d+)$/);
          if (dayMatch) {
            const day = parseInt(dayMatch[1]);
            if (!acc[day]) {
              acc[day] = [];
            }
            acc[day].push(facility);
          }
    
          return acc;
        }, {});
    
        // Convert object to array and sort by day
        const facilityArrays = Object.keys(marketChartData)
          .map(day => ({
            day: parseInt(day),
            facilities: marketChartData[day],
          }))
          .sort((a, b) => a.day - b.day);
    
        // Check if all facilities have a total of 0
        const allFacilitiesZero = facilityArrays.every(dayData =>
          dayData.facilities.every(facility => parseInt(facility.total) === 0)
        );
    
        // Send an empty array if all facilities' total values are 0
        if (allFacilitiesZero) {
          res.json([]);
        } else {
          res.json(facilityArrays);
        }
      } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
      }
    });
    

    // router.get('/widgetcommonscan', async (req, res) => {
    //   try {
    //     const query = `
    //       SELECT 
    //         REPLACE(br.cs_type, 'cs_', '') AS title, -- Remove 'cs_' prefix
    //         DATE_FORMAT(STR_TO_DATE(br.cs_date, '%Y-%m-%d'), '%Y-%m-%d') AS date,
    //         COUNT(*) AS total
    //       FROM 
    //         cs_os_badgerecords br
    //       WHERE 
    //         br.cs_type NOT REGEXP '[0-9]$'
    //       GROUP BY 
    //         br.cs_type, date;
    //     `;
    
    //     const [result] = await pool.query(query);
    
    //     const widgetData = result.reduce((acc, row) => {
    //       const { date, title, total } = row;
    //       if (!date) return acc;
    
    //       if (!acc[date]) {
    //         acc[date] = [];
    //       }
    
    //       acc[date].push({ title, total: total.toString() });
    
    //       return acc;
    //     }, {});
    
    //     const responseData = Object.keys(widgetData).map(date => ({
    //       date,
    //       facilities: widgetData[date],
    //     }));
    
    //     res.json(responseData);
    //   } catch (err) {
    //     console.error('Error executing query:', err);
    //     res.status(500).json({ error: 'Internal server error', message: err.message });
    //   }
    // });
    

    router.get('/widgetcommonscan', verifyToken, async (req, res) => {
      try {
        const query = `
            SELECT 
    REPLACE(br.cs_type, 'cs_', '') AS title, -- Remove 'cs_' prefix
  DATE_FORMAT(STR_TO_DATE(br.cs_date, '%d/%m/%Y'), '%Y-%m-%d') AS date,
    COUNT(*) AS total
  FROM 
    cs_os_badgerecords br
  WHERE 
    br.cs_type NOT REGEXP '[0-9]$'
  GROUP BY 
    br.cs_type, date;
        `;
    
        const [result] = await pool.query(query);
        console.log('Query result:', result); // Log the result for debugging
    
        const widgetData = result.reduce((acc, row) => {
          const { date, title, total } = row;
          if (!date) return acc;
    
          if (!acc[date]) {
            acc[date] = [];
          }
    
          acc[date].push({ title, total: total.toString() });
    
          return acc;
        }, {});
    
        const responseData = Object.keys(widgetData).map(date => ({
          date,
          facilities: widgetData[date],
        }));
    
        res.json(responseData);
      } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
      }
    });
    
    
    
    
//     router.get('/widgetdatapie2', async (req, res) => {
//       try {
//         // Query to fetch counts for all facilities from cs_os_facility_detail table
//         const query = `
//         SELECT 
//         REPLACE(REGEXP_REPLACE(fd.cs_facility_name, '\\d+$', ''), 'cs_', '') AS title, -- Remove 'cs_' prefix and numeric suffix
//         STR_TO_DATE(br.cs_date, '%d-%m-%Y') AS date, -- Convert 'dd-mm-yyyy' format to 'yyyy-mm-dd'
//         COUNT(*) AS total
//     FROM 
//         cs_os_facility_detail fd 
//     LEFT JOIN 
//         cs_os_badgerecords br ON fd.cs_facility_name = br.cs_type 
//     WHERE 
//         fd.cs_status = 1 
//     GROUP BY 
//         title, date;
    
    
//         `;
    
//         // Execute the query using promises
//         const [result] = await pool.query(query);
    
// // Process the result to match the required JSON format
// // Process the result to match the required JSON format
// const widgetData = result.reduce((acc, row) => {
//   if (!row.date) {
//     // Skip rows without a valid date
//     return acc;
//   }

//   const date = row.date.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string
//   const title = row.title.replace(/^cs_/, ''); // Remove 'cs_' prefix from title
//   const total = row.total ? row.total : 0; // Handle null total counts
  
//   // Get the common category (e.g., 'lunch') from the facility title without the numeric suffix
//   const commonTitle = title.replace(/\d+$/, '');

//   // Ensure the date is in the object
//   if (!acc[date]) {
//     acc[date] = {};
//   }

//   // Ensure the common title is in the object
//   if (!acc[date][commonTitle]) {
//     acc[date][commonTitle] = 0;
//   }

//   // Add the total count to the common title
//   acc[date][commonTitle] += total;

//   return acc;
// }, {});

// // Convert object to array and format it for response
// const responseData = Object.keys(widgetData).map(date => ({
//   date: date,
//   facilities: Object.entries(widgetData[date]).map(([commonTitle, total]) => ({
//     title: commonTitle,
//     total: total.toString(),
//   })),
// }));

// // Send the formatted data as response
// res.json(responseData);


    
//       } catch (err) {
//         console.error('Error executing query:', err);
//         res.status(500).json({ error: 'Internal server error', message: err.message });
//       }
//     });
    


    router.get('/widgetdatapie', verifyToken, async (req, res) => {
      try {
        // Query to fetch counts for all facilities from cs_os_facility_detail table
        const query = `
        SELECT 
        REPLACE(REGEXP_REPLACE(fd.cs_facility_name, '\\d+$', ''), 'cs_', '') AS title, -- Remove 'cs_' prefix and numeric suffix
        CASE
          WHEN br.cs_date LIKE '%/%' THEN STR_TO_DATE(br.cs_date, '%d/%m/%Y') -- Handle 'dd/mm/yyyy' format
          ELSE STR_TO_DATE(br.cs_date, '%d-%m-%Y') -- Handle 'dd-mm-yyyy' format
        END AS date, -- Normalize both date formats
        COUNT(*) AS total
      FROM 
        cs_os_facility_detail fd 
      LEFT JOIN 
        cs_os_badgerecords br ON fd.cs_facility_name = br.cs_type 
      WHERE 
        fd.cs_status = 1 
      GROUP BY 
        title, date;
        `;
    
        // Execute the query using promises
        const [result] = await pool.query(query);
    
// Process the result to match the required JSON format
// Process the result to match the required JSON format
const widgetData = result.reduce((acc, row) => {
  if (!row.date) {
    // Skip rows without a valid date
    return acc;
  }

  const date = row.date.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string
  const title = row.title.replace(/^cs_/, ''); // Remove 'cs_' prefix from title
  const total = row.total ? row.total : 0; // Handle null total counts
  
  // Get the common category (e.g., 'lunch') from the facility title without the numeric suffix
  const commonTitle = title.replace(/\d+$/, '');

  // Ensure the date is in the object
  if (!acc[date]) {
    acc[date] = {};
  }

  // Ensure the common title is in the object
  if (!acc[date][commonTitle]) {
    acc[date][commonTitle] = 0;
  }

  // Add the total count to the common title
  acc[date][commonTitle] += total;

  return acc;
}, {});

// Convert object to array and format it for response
const responseData = Object.keys(widgetData).map(date => ({
  date: date,
  facilities: Object.entries(widgetData[date]).map(([commonTitle, total]) => ({
    title: commonTitle,
    total: total.toString(),
  })),
}));

// Send the formatted data as response
res.json(responseData);


    
      } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
      }
    });
    
    // API WITH FACILITY IMAGES

// router.get('/widgetdataWithPercent', async (req, res) => {
//   try {
//     // Join tables for facility details and logo URL
//     const query = `
//       SELECT 
//         fdt.cs_facility_name AS title, 
//         SUM(CASE WHEN br.cs_type IS NOT NULL THEN 1 ELSE 0 END) AS total,
//         ft.cs_logo_darkmode_image_url
//       FROM 
//         cs_os_facility_detail fdt
//       LEFT JOIN 
//         cs_os_badgerecords br ON fdt.cs_facility_name = br.cs_type
//       INNER JOIN 
//         cs_os_facilitytype ft ON fdt.cs_facility_id = ft.cs_facility_id  -- Use INNER JOIN for facility data
//       WHERE 
//         fdt.cs_status = 1 
//       GROUP BY 
//         fdt.cs_facility_name, ft.cs_logo_darkmode_image_url;
//     `;

//     // Execute the query using promises
//     const [result] = await pool.query(query);

//     // Format the result with additional data
//     const DataWidgetWithPercentage = result.map(row => {
//       let title = row.title.replace(/^cs_/, ''); // Remove 'cs_' prefix
//       if (/\d$/.test(title)) {
//         title = title.replace(/(\d+)$/, ' Day $1'); // Append 'Day' to titles ending with a number
//       }
//       title = title.charAt(0).toUpperCase() + title.slice(1); // Capitalize the first letter

//       return {
//         title: title,
//         image: row.cs_logo_darkmode_image_url || "1.png", // Use logo URL if available, fallback to default
//         total: row.total.toString(),
//         color: 'secondary',
//         chart: {
//           color: ["var(--theme-default)"],
//           series: [78],
//         },
//       };
//     });

//     // Send the widget data as response
//     res.json(DataWidgetWithPercentage);
//   } catch (err) {
//     console.error('Error executing query:', err);
//     res.status(500).json({ error: 'Internal server error', message: err.message });
//   }
// });

router.get('/totalCounts', verifyToken, async (req, res) => {
  try {
    // Fetch cs_facility_name and cs_logo_image_url values from cs_os_facility_detail and cs_os_facilitytype tables
    const facilityNamesQuery = `
      SELECT 
        fd.cs_facility_name, 
        ft.cs_logo_image_url
      FROM 
        cs_os_facility_detail fd
      JOIN 
        cs_os_facilitytype ft ON fd.cs_facility_id = ft.cs_facility_id
      WHERE 
        fd.cs_status = 1 AND ft.cs_status = 1;
    `;
    const [facilityNamesResult] = await pool.query(facilityNamesQuery);

    // Extract cs_facility_name values and cs_logo_image_url, and remove numbers from the end of facility names
    const facilityData = facilityNamesResult.map(row => {
      return {
        facilityName: row.cs_facility_name.replace(/\d+$/, ''), // Remove numbers from the end
        logoUrl: row.cs_logo_image_url
      };
    });

    // Construct the query dynamically to fetch total counts for each facility type
    const totalCountsQueries = facilityData.map(data => {
      return `
        SELECT 
          'Total ${data.facilityName} Counts' AS title,
          COUNT(*) AS total 
        FROM 
          cs_os_badgerecords 
        WHERE 
          cs_type LIKE '${data.facilityName}%';
      `;
    });

    // Execute all queries asynchronously
    const totalCountsResults = await Promise.all(totalCountsQueries.map(query => pool.query(query)));

    const getFormattedFacilityName = (name) => {
      if (name && name.startsWith && name.includes('_')) {
        const [prefix, suffix] = name.split('_');
        const formattedSuffix = suffix.charAt(0).toUpperCase() + suffix.slice(1).replace(/\d+/g, day => ` day ${day}`);
        return `${formattedSuffix}`;
      } else {
        return name || '';
      }
    };

    // Aggregate the counts for each facility type
    const totalCountWidgets = {};
    totalCountsResults.forEach((result, index) => {
      const { facilityName, logoUrl } = facilityData[index];
      const total = result[0][0].total.toString();
      if (!totalCountWidgets[facilityName]) {
        let formattedFacilityName = facilityName.replace(/^cs_/, '');
        formattedFacilityName = formattedFacilityName.charAt(0).toUpperCase() + formattedFacilityName.slice(1);
        totalCountWidgets[formattedFacilityName] = {
          title: `Total ${formattedFacilityName} Counts`,
          image: logoUrl, // Use the fetched logo URL here
          total: total,
          color: 'secondary', // Example color
          chart: {
            color: ["var(--theme-default)"],
            series: [78],
          },
        };
      }
    });

    // Convert the aggregated widget data into an array
    const totalCountWidgetsArray = Object.values(totalCountWidgets);

    // Send the widget data as response
    res.json(totalCountWidgetsArray);
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});


// Define your API endpoints
router.get('/eventname',verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT `cs_value` FROM `cs_tbl_sitesetting` WHERE `cs_parameter` = 'Event Name'");
    res.json(rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/eventdays',verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT `cs_value` FROM `cs_tbl_sitesetting` WHERE `cs_parameter` = 'Event Days'");
    res.json(rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/timezone',verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT `cs_value` FROM `cs_tbl_sitesetting` WHERE `cs_parameter` = 'Time Zone'");
    res.json(rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/categoryregistrations', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        cs_reg_category,
        COUNT(*) AS total,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS registrationDate
      FROM 
        cs_os_users
        WHERE cs_isconfirm = 1
      GROUP BY 
        cs_reg_category, DATE(created_at);
    `;

    const [result] = await pool.query(query);

    const categoryRegistrationData = result.reduce((acc, row) => {
      const registrationDate = row.registrationDate;
      if (!acc[registrationDate]) {
        acc[registrationDate] = [];
      }
      acc[registrationDate].push({
        category: row.cs_reg_category,
        total: row.total
      });
      return acc;
    }, {});

    const registrationArrays = Object.keys(categoryRegistrationData)
      .map(date => ({
        date,
        registrations: categoryRegistrationData[date],
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(registrationArrays);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});


module.exports = router;
