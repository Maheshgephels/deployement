// validationUtils.jsx

export const required = value => (value ? undefined : 'This field is required');

export const expiryDate = value => (value ? undefined : 'Please provide valid input to proceed');

export const option = value => (value ? undefined : 'Please provide valid input to proceed');


//Name validation

export const NAME = (value) => {
  if (!value) {
    return 'This field is required';
  }

  if (/^\s+|\s+$/.test(value)) {
    return 'Leading or trailing spaces are not allowed.';
  }

  if (!/^[a-zA-Z0-9 ()_/'-~]+$/.test(value)) {
    return 'Only alphanumeric characters and () _ - / are allowed.';
  }

  return undefined;
};

export const HallNAME = (value) => {
  if (!value) {
    return 'This field is required';
  }

  // Check if the value starts with a number
  if (/^\d/.test(value)) {
    return 'Cannot start with a number';
  }

  // Check for allowed characters
  // if (!/^[a-zA-Z0-9 ()_/'-~]+$/.test(value)) {
  //   return 'Only alphanumeric characters and () _ - / are allowed.';
  // }

  return undefined;
};

export const Notify = (value) => {
  if (!value) {
    return 'This field is required';
  }

  if (/^\s+|\s+$/.test(value)) {
    return 'Leading or trailing spaces are not allowed.';
  }

  // Split the value into words based on spaces and filter out any empty strings
  const words = value.trim().split(/\s+/).filter(Boolean);

  // Check maximum word count (e.g., 750 words)
  if (words.length > 250) {
    return 'Description is too long (maximum 250 words)';
  }


  return undefined;
};


export const username = (value) => {
  if (!value || value.length < 6 || value.length > 12) {
    return 'Name must be between 6 and 12 characters long.';
  }

  if (value !== value.trim()) {
    return 'Username must not have leading or trailing spaces';
  }

  // Regular expression to check if the name contains invalid characters
  // if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
  //   return 'Name can only contain alphanumeric characters, hyphen, and underscore.';
  // }

  return undefined;
};

export const username1 = (value) => {
  if (!value || value.length < 6 || value.length > 12) {
    return 'Name must be between 6 and 12 characters long.';
  }

  // Regular expression to check if the name contains invalid characters and does not start with a number
  // if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(value)) {
  //   return 'Name can only contain alphanumeric characters, hyphen, and underscore, and must not start with a number.';
  // }

  if (value !== value.trim()) {
    return 'Username must not have leading or trailing spaces';
  }

  return undefined;
};

export const Editusername = (value) => {
  if (!value || value.length < 3 || value.length > 32) {
    return 'Name must be between 3 and 32 characters long.';
  }

  // Regular expression to check if the name contains invalid characters and does not start with a number
  if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(value)) {
    return 'Name can only contain alphanumeric characters, hyphen, and underscore, and must not start with a number.';
  }

  return undefined;
};



export const Wname = value =>
  value && /^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(value)
    ? undefined
    : 'Only alphabetic characters are allowed';

// export const FacName = value => {

//   if (/^\s+|\s+$/.test(value)) {
//     return 'Leading or trailing spaces are not allowed.';
//   }

//   if (!/^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(value)) {
//     return 'Only alphabetic characters are allowed';
//   }
//   return undefined;
// };

export const FacName = value => {
  // Check for leading or trailing spaces
  if (/^\s+|\s+$/.test(value)) {
    return 'Leading or trailing spaces are not allowed.';
  }

  // Check if the value contains only alphabetic characters or numeric characters not in the trailing position
  if (!/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/.test(value)) {
    return 'Only alphabetic and numeric characters are allowed, but numbers cannot be at the end.';
  }

  // Check if the last character is a number
  if (/\d$/.test(value)) {
    return 'Numbers cannot be in the trailing position.';
  }

  return undefined;
};


// export const FacName = value => {
//   // Check if value is provided
//   if (!value) return undefined;

//   // Regex explanation:
//   // ^ - Start of string
//   // [a-zA-Z0-9]+ - At least one alphanumeric character
//   // (?: [a-zA-Z0-9]+)* - Zero or more occurrences of space followed by at least one alphanumeric character
//   // (?!.*\\d+$) - Negative lookahead to ensure the last segment isn't purely numeric
//   const regex = /^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*(?!.*\d+$)/;

//   return regex.test(value) ? undefined : 'Only alphanumeric characters are allowed, and suffix must not be numeric';
// };

export const pageName = value => {

  // Check maximum length (e.g., 255 characters)
  if (value.length > 25) {
    return 'Page name is too long (maximum 25 characters)';
  }

  if (/^\s+|\s+$/.test(value)) {
    return 'Leading or trailing spaces are not allowed.';
  }

  if (!/^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(value)) {
    return 'Only alphabetic characters are allowed';
  }
  return undefined;
};

// value && /^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(value)
//   ? undefined
//   : 'Only alphabetic characters are allowed';

export const Name = value =>
  value && /^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/.test(value)
    ? undefined
    : 'Only alphanumeric characters are allowed.';

export const fieldname = (value) => {

  if (/^\s+|\s+$/.test(value)) {
    return 'Leading or trailing spaces are not allowed.';
  }

  if (!/^[a-zA-Z0-9-_()]+(?: [a-zA-Z0-9-_()]+)*$/.test(value)) {
    return 'Only alphanumeric characters are allowed.';
  }
  return undefined;
};


export const RoleName = value =>
  value && /^[a-zA-Z0-9-_() ]+$/.test(value)
    ? undefined
    : 'Only alphanumeric characters, spaces, and () _ - are allowed.';





//Email Validation 
export const email = (value) => {
  if (!value) {
    return 'This field is required';
  }

  if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/i.test(value)) {
    return 'Invalid email address';
  }

  return undefined;
};

//Radio button validation
export const radio = (value) => {
  if (!value) {
    return 'This field is required';
  }

  return undefined;
};

export const Contact = (value) => {
  if (!value) {
    return undefined;
  }

  // Regex pattern to ensure up to 16 digits in total
  if (!/^\+?\d{1,4}[\s-]?\d{1,12}$/i.test(value)) {
    return 'Please enter a valid mobile number';
  }

  return undefined;
};


//Contact Person validation

export const ContactPerson = (value) => {
  // Check for leading or trailing spaces
  if (/^\s+|\s+$/.test(value)) {
    return 'Leading or trailing spaces are not allowed.';
  }

  // Check for allowed characters and spaces
  if (!/^[a-zA-Z0-9-_()]+(?: [a-zA-Z0-9-_()]+)*$/.test(value)) {
    return 'Only alphanumeric characters are allowed.';
  }

  return undefined;
};


//Address validation

export const Address = (value) => {
  if (!value) {
    return undefined;
  }

  // Check minimum length (e.g., 10 characters)
  if (value.length < 10) {
    return 'Address is too short (minimum 10 characters)';
  }

  // Check maximum length (e.g., 255 characters)
  if (value.length > 255) {
    return 'Address is too long (maximum 255 characters)';
  }

  // Check for allowed characters (alphanumeric, spaces, commas, periods, hyphens, and slashes)
  if (!/^[a-zA-Z0-9\s,.-/]+$/.test(value)) {
    return 'Address contains invalid characters';
  }

  return undefined;
};

//Exhibitor email validation
export const Email = (value) => {
  if (!value) {
    return undefined;
  }

  if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/i.test(value)) {
    return 'Invalid email address';
  }

  return undefined;
};


//Website validation
export const Website = (value) => {
  if (!value) {
    return undefined;
  }

  // Regex pattern for URL validation
  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;

  if (!urlPattern.test(value)) {
    return 'Invalid URL format';
  }

  return undefined;
};





//Description Validation

export const Description = (value) => {
  if (!value) {
    return undefined;
  }

  // Split the value into words based on spaces and filter out any empty strings
  const words = value.trim().split(/\s+/).filter(Boolean);

  // Check minimum word count (e.g., 10 words)
  if (words.length < 10) {
    return 'Description is too short (minimum 10 words)';
  }

  // Check maximum word count (e.g., 750 words)
  if (words.length > 750) {
    return 'Description is too long (maximum 750 words)';
  }

  return undefined;
};


export const shortbio = (value) => {
  if (!value) {
    return 'This field is required';
  }

  // Split the input value into an array of words
  const words = value.trim().split(/\s+/); // Splits on any whitespace, including spaces, tabs, and newlines
  const wordCount = words.length;

  // Check minimum length (e.g., 10 words)
  if (wordCount < 10) {
    return 'Description is too short (minimum 10 words)';
  }

  // Check maximum length (e.g., 250 words)
  if (wordCount > 250) {
    return `Description is too long (maximum 250 words, currently ${wordCount} words)`;
  }

  return undefined;
};


export const longbio = (value) => {


  // Split the input value into an array of words
  const words = value.trim().split(/\s+/); // Splits on any whitespace, including spaces, tabs, and newlines
  const wordCount = words.length;

  // Check maximum length (e.g., 1000 words)
  if (wordCount > 1000) {
    return `Description is too long (maximum 1000 words, currently ${wordCount} words)`;
  }

  return undefined;
};






//Number Validation

export const selection = value =>
  value ? undefined : 'Please make a selection';

export const number = (value) => {
  if (!value) {
    return 'This field is required';
  }

  if (!/^\+?[0-9]+$/.test(value)) {
    return 'Please enter a valid positive number, optionally prefixed with +';
  }

  return undefined;
};

export const mobileno = (value) => {
  if (!value) {
    return 'This field is required';
  }

  // Regular expression to check if the number is valid and length check for 10 to 16 digits
  if (!/^\+?[0-9]{10,16}$/.test(value)) {
    return 'Please enter a valid positive number with 10 to 16 digits, optionally prefixed with +';
  }

  return undefined;
};


// value && !isNaN(value) ? undefined : 'Please enter a valid number';



//Password Validation

// export const password = value => {
//   if (!value) {
//     return 'Password is required';
//   }

//   const lengthCriteria = /.{6,12}/;
//   const uppercaseCriteria = /[A-Z]/;
//   const lowercaseCriteria = /[a-z]/;
//   const digitCriteria = /[0-9]/;
//   const specialCharacterCriteria = /[!@#$%^&*(),.?":{}|<>]/;

//   if (!lengthCriteria.test(value)) {
//     return 'Password must be at least 8 characters long';
//   }
//   if (!uppercaseCriteria.test(value)) {
//     return 'Password must include at least one uppercase letter';
//   }
//   if (!lowercaseCriteria.test(value)) {
//     return 'Password must include at least one lowercase letter';
//   }
//   if (!digitCriteria.test(value)) {
//     return 'Password must include at least one digit';
//   }
//   if (!specialCharacterCriteria.test(value)) {
//     return 'Password must include at least one special character';
//   }

//   return undefined;
// };

export const password = value => {
  if (!value) {
    return 'Password is required';
  }

  // Check for leading or trailing spaces
  if (value !== value.trim()) {
    return 'Password must not have leading or trailing spaces';
  }

  // Check if length is between 6 and 12 characters
  if (value.length < 6 || value.length > 12) {
    return 'Password must be between 6 and 12 characters long';
  }

  return undefined;
};




export const Editpassword = value => {
  if (!value) {
    return 'Password is required';
  }

  const lengthCriteria = /.{4,}/;
  // const uppercaseCriteria = /[A-Z]/;
  // const lowercaseCriteria = /[a-z]/;
  // const digitCriteria = /[0-9]/;
  // const specialCharacterCriteria = /[!@#$%^&*(),.?":{}|<>]/;

  if (!lengthCriteria.test(value)) {
    return 'Password must be at least 4 characters long';
  }
  // if (!uppercaseCriteria.test(value)) {
  //   return 'Password must include at least one uppercase letter';
  // }
  // if (!lowercaseCriteria.test(value)) {
  //   return 'Password must include at least one lowercase letter';
  // }
  // if (!digitCriteria.test(value)) {
  //   return 'Password must include at least one digit';
  // }
  // if (!specialCharacterCriteria.test(value)) {
  //   return 'Password must include at least one special character';
  // }

  return undefined;
};



//Image Validation

export const file = value => {
  console.log('Value:', value);
  if (!value || !value.type) {
    return 'Please upload an image file';
  }

  // Define the maximum allowed size (in bytes)
  const maxSize = 200 * 1024; // 200 KB

  console.log('File type:', value.type);

  if (value.size > maxSize) {
    return 'Image size exceeds the maximum allowed size (200 KB)';
  }

  return undefined;
};


export const Img = (file) => {

  return new Promise((resolve, reject) => {
    if (!file) {
      return;
    }

    // const allowedImageTypes = ['image/png'];
    const allowedImageTypes = ['image/png'];
    const maxSizeBytes = 200 * 1024; // 200 KB converted to bytes
    const maxWidth = 600; // Maximum width in pixels
    const maxHeight = 600; // Maximum height in pixels

    if (!allowedImageTypes.includes(file.type)) {
      reject('Please select a PNG image file.');
      return;
    }

    if (file.size > maxSizeBytes) {
      reject('The selected image file size exceeds the 200 KB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        if (this.width > maxWidth) {
          reject(`The width of the selected image exceeds the ${maxWidth} pixels limit.`);
        } else if (this.height > maxHeight) {
          reject(`The height of the selected image exceeds the ${maxHeight} pixels limit.`);
        } else {
          resolve('');
        }
      };
      img.onerror = function () {
        reject('Failed to load the selected image.');
      };
      img.src = e.target.result;
    };
    reader.onerror = function () {
      reject('Error reading the file.');
    };
    reader.readAsDataURL(file);
  });
};

export const Img1 = (file) => {

  return new Promise((resolve, reject) => {
    if (!file) {
      reject('This field is required');
      return;
    }

    // const allowedImageTypes = ['image/png'];
    const allowedImageTypes = ['image/png'];
    const maxSizeBytes = 200 * 1024; // 200 KB converted to bytes
    const maxWidth = 600; // Maximum width in pixels
    const maxHeight = 600; // Maximum height in pixels

    if (!allowedImageTypes.includes(file.type)) {
      reject('Please select a  PNG, JPG and JPEG image file.');
      return;
    }

    if (file.size > maxSizeBytes) {
      reject('The selected image file size exceeds the 200 KB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        if (this.width > maxWidth) {
          reject(`The width of the selected image exceeds the ${maxWidth} pixels limit.`);
        } else if (this.height > maxHeight) {
          reject(`The height of the selected image exceeds the ${maxHeight} pixels limit.`);
        } else {
          resolve('');
        }
      };
      img.onerror = function () {
        reject('Failed to load the selected image.');
      };
      img.src = e.target.result;
    };
    reader.onerror = function () {
      reject('Error reading the file.');
    };
    reader.readAsDataURL(file);
  });
};

export const BanImg = (file) => {

  return new Promise((resolve, reject) => {
    if (!file) {
      reject('Please select an image file.');
      return;
    }

    const allowedImageTypes = ['image/png', 'image/jpeg', 'images/jpg'];;
    const maxSizeBytes = 300 * 1024; // 300 KB converted to bytes
    const maxWidth = 2000; // Maximum width in pixels
    const maxHeight = 600; // Maximum height in pixels

    if (!allowedImageTypes.includes(file.type)) {
      reject('Please select a PNG, JPG or JPEG image file.');
      return;
    }

    if (file.size > maxSizeBytes) {
      reject('The selected image file size exceeds the 300 KB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        if (this.width > maxWidth) {
          reject(`The width of the selected image exceeds the ${maxWidth} pixels limit.`);
        } else if (this.height > maxHeight) {
          reject(`The height of the selected image exceeds the ${maxHeight} pixels limit.`);
        } else {
          resolve('');
        }
      };
      img.onerror = function () {
        reject('Failed to load the selected image.');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export const BackImg = (file) => {

  return new Promise((resolve, reject) => {
    if (!file) {
      reject('Please select an image file.');
      return;
    }

    const allowedImageTypes = ['image/png', 'image/jpeg'];;
    const maxSizeBytes = 500 * 1024; // 300 KB converted to bytes
    const maxWidth = 300; // Maximum width in pixels
    const maxHeight = 500; // Maximum height in pixels

    if (!allowedImageTypes.includes(file.type)) {
      reject('Please select a PNG, JPG or JPEG image file.');
      return;
    }

    if (file.size > maxSizeBytes) {
      reject('The selected image file size exceeds the 500 KB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        if (this.width > maxWidth) {
          reject(`The width of the selected image exceeds the ${maxWidth} pixels limit.`);
        } else if (this.height > maxHeight) {
          reject(`The height of the selected image exceeds the ${maxHeight} pixels limit.`);
        } else {
          resolve('');
        }
      };
      img.onerror = function () {
        reject('Failed to load the selected image.');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export const ReceiptHeaderFooter = (file) => {

  return new Promise((resolve, reject) => {
    if (!file) {
      reject('Please select an image file.');
      return;
    }

    const allowedImageTypes = ['image/png', 'image/jpeg', 'images/jpg'];;
    const maxSizeBytes = 200 * 1024; // 200 KB converted to bytes
    const maxWidth = 800; // Maximum width in pixels
    const maxHeight = 100; // Maximum height in pixels

    if (!allowedImageTypes.includes(file.type)) {
      reject('Please select a PNG, JPG or JPEG image file.');
      return;
    }

    if (file.size > maxSizeBytes) {
      reject('The selected image file size exceeds the 300 KB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        if (this.width > maxWidth) {
          reject(`The width of the selected image exceeds the ${maxWidth} pixels limit.`);
        } else if (this.height > maxHeight) {
          reject(`The height of the selected image exceeds the ${maxHeight} pixels limit.`);
        } else {
          resolve('');
        }
      };
      img.onerror = function () {
        reject('Failed to load the selected image.');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

//-------Backup Validation -----------//

// export const Img = (file) => {
//   if (!file) return 'This field is required';

//   const allowedImageTypes = ['image/png'];
//   const maxSizeBytes = 200 * 1024; // 200 KB converted to bytes

//   if (!allowedImageTypes.includes(file.type)) {
//     return 'Please select a PNG image.';
//   }

//   if (file.size > maxSizeBytes) {
//     return 'Image file size exceeds 200 KB limit.';
//   }

//   return '';
// };


// export const PDF = (file) => {
//   if (!file) return 'Please select a file.';

//   const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
//   const maxSizeMB = 1;

//   if (!allowedDocTypes.includes(file.type)) {
//     return 'Please select a PDF, DOC, or DOCX document.';
//   }

//   if (file.size > maxSizeMB * 1024 * 1024) {
//     return 'Document file size exceeds 1 MB limit.';
//   }

//   return '';
// };
export const PDF = (file) => {
  if (!file) return;

  const allowedDocTypes = ['application/pdf'];
  const maxSizeMB = 1;

  if (!allowedDocTypes.includes(file.type)) {
    return 'Please select a PDF document.';
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return 'Document file size exceeds 1 MB limit.';
  }

  return '';
};




// export const name = value =>
//   value && /^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/.test(value.trim())
//     ? undefined
//     : 'Only alphanumeric characters are allowed, with no leading or trailing spaces.';