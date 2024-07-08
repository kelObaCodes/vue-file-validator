# vue-file-validator

vue-file-validator is a Vue.js plugin that provides a robust and customizable solution for validating files. It supports validation of various file types, including images and PDFs, with options for file size, type checks, dimensions, and custom validation functions.

## Table of Contents

-   Installation
-   Basic Usage
-   Options
-   Custom Validations
-   Advanced Example
-   License

## Installation

Install the plugin via npm or yarn:

```sh
npm install vue-file-validator
```

or

```sh
yarn add vue-file-validator

```

## Basic Usage

To use the **vue-file-validator** plugin, follow these steps:

1. **Register the Plugin**
   In your Vue application, import and register the plugin:

```javascript
// main.js or main.ts
import { createApp } from "vue"; // Vue 3
import App from "./App.vue";
import vueFileValidator from "vue-file-validator";

const app = createApp(App);
app.use(vueFileValidator);
app.mount("#app");

```
For Vue 2

```javascript
// main.js
import Vue from "vue";
import App from "./App.vue";
import vueFileValidator from "vue-file-validator";

Vue.use(vueFileValidator);

new Vue({
    render: (h) => h(App),
}).$mount("#app");
```

2. **Use the Plugin in Your Component**

```javascript
<template>
  <input type="file" @change="validateFile" accept=".png, .jpg, .jpeg, .pdf" />
</template>

<script>
export default {
  methods: {
    validateFile(event) {
      const options = {
        sizeInKbAllowed: 5000, // Optional custom file size limit (5 MB)
        showAlert:true
      };

      this.$validateFile(event, options).then((file) => {
        console.log('File is valid:', file);
      }).catch((error) => {
        console.error('File validation failed:', error);
      });
    }
  }
}
</script>

```

## Options

You can customize the validation behavior using the following options:

```javascript
const defaultOptions = {
    showAlert: true, // Show alert messages for validation errors
    sizeInKbAllowed: 10240, // Maximum allowed file size in KB (default: 10 MB)
    allowedTypes: ["image/jpeg", "image/png", "application/pdf"], // Allowed MIME types
    heightOfImage: 2000, // Maximum allowed height for images in pixels
    widthOfImage: 2000, // Maximum allowed width for images in pixels
    pdfPageMinCount: 3,
    pdfPageMaxCount: 1,
    messages: {
        noFile: "No file selected.", // Message when no file is selected
        fileSize: "File size exceeds the allowed limit.", // Message for size validation
        fileType: "Invalid file type.", // Message for type validation
        dimensions: "Invalid image dimensions.", // Message for dimension validation
        invalidPdf: "Invalid PDF file.", // Message for invalid PDF
        pageCount: "PDF does not meet the required page count.", // Message for PDF page count
    },
    customValidations: {
        image: [
            // Array of custom validation functions for images
            (file, image) => {
                if (file.name.includes("test")) {
                    return "Image file name should not contain 'test'.";
                }
                return true;
            },
        ],
        pdf: [
            // Array of custom validation functions for PDFs
            (file, pdfData, pdfText) => {
                if (!pdfText.includes("RequiredKeyword")) {
                    return "The PDF file does not contain the required keyword.";
                }
                return true;
            },
        ],
    },
};
```

**Description of Options**

-   **showAlert (optional, default: true):** Show alert messages for validation errors.
-   **sizeInKbAllowed* (required, default: 10240):** Maximum allowed file size in kilobytes.
-   **allowedTypes* (required, default: ['image/jpeg', 'image/png', 'application/pdf']):** Array of allowed MIME types.
-   **heightOfImage (optional, default: 2000):** Maximum allowed height for images in pixels.
-   **widthOfImage (optional, default: 2000):** Maximum allowed width for images in pixels.
-   **pdfPageMinCount (optional, default: 1):** Minimum allowed pages for pdfs.
-   **pdfPageMaxCount (optional, default: 10):** Maximum allowed pages for pdfs.
-   **messages (optional):** Custom messages for validation errors.
-   **customValidations (optional):** Object containing arrays of custom validation functions for images and PDFs.

## Custom Validations

Custom validation functions allow you to define additional checks for files. Each function should return **true** if the validation passes, or a string message if it fails.

**Custom Validation for Images**

```javascript
const options = {
    customValidations: {
        image: [
            (file, image) => {
                if (file.name.includes("sample")) {
                    return "Image file name should not contain 'sample'.";
                }
                return true;
            },
        ],
    },
};
```

**Custom Validation for PDFs**

```javascript
const options = {
    customValidations: {
        pdf: [
            (file, pdfData, pdfText) => {
                if (!pdfText.includes("Important")) {
                    return "The PDF file must contain 'Important'.";
                }
                return true;
            },
        ],
    },
};
```

## Advanced Example

Here’s a more advanced example demonstrating how to use multiple options and custom validations:

```javascript
<template>
  <input type="file" @change="validateFile" accept=".png, .jpg, .jpeg, .pdf" />
</template>

<script>
export default {
  methods: {
    validateFile(event) {
      const options = {
        showAlert: true,
        sizeInKbAllowed: 8000,
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        heightOfImage: 1000,
        widthOfImage: 1000,
        messages: {
          noFile: "Please select a file.",
          fileSize: "The file size is too large.",
          fileType: "Unsupported file type.",
          dimensions: "The image dimensions are too large.",
          invalidPdf: "This is not a valid PDF.",
          pageCount: "The PDF does not have the required number of pages."
        },
        customValidations: {
          image: [
            (file, image) => {
              if (image.height < 200) {
                return "The image height must be at least 200 pixels.";
              }
              return true;
            }
          ],
          pdf: [
            (file, pdfData, pdfText) => {
              if (pdfText.split('%%EOF').length - 1 < 2) {
                return "The PDF should have at least 2 pages.";
              }
              return true;
            }
          ]
        }
      };

      this.$validateFile(event, options).then((file) => {
        console.log('File passed all validations:', file);
      }).catch((error) => {
        console.error('Validation error:', error);
      });
    }
  }
}
</script>

```

## License*
This project is licensed under the MIT License. See the LICENSE file for more details.
