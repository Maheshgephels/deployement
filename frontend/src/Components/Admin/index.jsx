// In your main App component or where you define your routes

import React, { Fragment,useState } from 'react';
import Permission from './roles-permission';
import SubTableComponent from './subtable';


import { Breadcrumbs } from '../../AbstractElements';

const App = () => {
    const [showSubTable, setShowSubTable] = useState(false);

    return (
        <Fragment>
          <SubTableComponent setShowSubTable={setShowSubTable} />
        </Fragment>
    );
};

// export default Form1;
// import React, { useState } from 'react';
// import {Router, Route, Switch } from 'react-router-dom';
// import Permission from './roles-permission';
// import SubTableComponent from './subtable';

// const App = () => {
//   const [showSubTable, setShowSubTable] = useState(false);

//   return (
//     <Router>
//       <Switch>
//         <Route path="/permission">
//           <Permission setShowSubTable={setShowSubTable} />
//         </Route>
//         <Route path="/sub-table">
//           <SubTableComponent />
//         </Route>
//       </Switch>
//       {showSubTable && (
//         <SubTableComponent />
//       )}
//     </Router>
//   );
// };

export default App;
