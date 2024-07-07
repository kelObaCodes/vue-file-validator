const fileValidationPlugin = {
  install(Vue) {
      const isVue3 = Vue.version.startsWith("3");
      const defaultOptions = {
          showAlert: false,
          sizeInKbAllowed: 10240, // Default to 10 MB
          allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
          heightOfImage: 2000, // Default maximum height for images
          widthOfImage: 2000, // Default maximum width for images
          pdfPageMinCount: 1, // Minimum PDF page count
          pdfPageMaxCount: 10, // Maximum PDF page count
          messages: {
              noFile: "No file selected.",
              fileSize: "File size exceeds the allowed limit.",
              fileType: "Invalid file type.",
              dimensions: "Invalid image dimensions.",
              invalidPdf: "Invalid PDF file.",
              pdfPageCount: "PDF does not meet the required page count."
          },
          customValidations: {
              image: [],
              pdf: [],
          },
      };

      const optionValidators = {
          showAlert: (value) => typeof value === 'boolean',
          sizeInKbAllowed: (value) => typeof value === 'number' && value > 0,
          allowedTypes: (value) => Array.isArray(value) && value.every(v => typeof v === 'string'),
          heightOfImage: (value) => typeof value === 'number' && value > 0,
          widthOfImage: (value) => typeof value === 'number' && value > 0,
          pdfPageMinCount: (value) => typeof value === 'number' && value > 0,
          pdfPageMaxCount: (value) => typeof value === 'number' && value >= defaultOptions.pdfPageMinCount,
          messages: (value) => {
              if (typeof value !== 'object' || value === null) return false;
              const allowedKeys = Object.keys(defaultOptions.messages);
              const keys = Object.keys(value);
              for (const key of keys) {
                  if (!allowedKeys.includes(key) || typeof value[key] !== 'string') {
                      return false;
                  }
              }
              return true;
          },
          customValidations: (value) => {
            if (typeof value !== 'object' || value === null) return false;
            const keys = Object.keys(value);
            if (keys.length === 0 || !keys.every(key => ['image', 'pdf'].includes(key))) return false;
            return keys.every(key => Array.isArray(value[key]) && value[key].every(fn => typeof fn === 'function'));
        },
      };

      const requiredOptions = ['sizeInKbAllowed', 'allowedTypes'];

      const validateOptions = (options) => {
          for (const key of requiredOptions) {
              if (!options.hasOwnProperty(key) || !optionValidators[key](options[key])) {
                  console.warn(`Invalid or missing required option for ${key}:`, options[key]);
                  return `Invalid or missing required option for ${key}: ${options[key]}. Expected type: ${typeof defaultOptions[key]}`;
              }
          }
          for (const key in options) {
              if (options.hasOwnProperty(key) && optionValidators.hasOwnProperty(key)) {
                  if (!optionValidators[key](options[key])) {
                      console.warn(`Invalid option for ${key}:`, options[key]);
                      if (key === 'messages') {
                          const allowedKeys = Object.keys(defaultOptions.messages);
                          const invalidKey = Object.keys(options[key]).find(k => !allowedKeys.includes(k) || typeof options[key][k] !== 'string');
                          if (invalidKey) {
                              return `Invalid option for ${key}.${invalidKey}: ${options[key][invalidKey]}. Expected type: string and allowed keys are: ${allowedKeys.join(', ')}`;
                          }
                      }
                      return `Invalid option for ${key}: ${options[key]}. Expected type: ${typeof defaultOptions[key]}`;
                  }
              }
          }
          return null;
      };

      const getPdfPageCount = (pdfText) => {
          const regex = /\/Count\s+(\d+)/g;
          let match;
          let pageCount = 0;
          while ((match = regex.exec(pdfText)) !== null) {
              pageCount = Math.max(pageCount, parseInt(match[1], 10));
          }
          return pageCount;
      };

      const validateFile = function (e, userOptions) {
          const invalidOptionMessage = validateOptions(userOptions);
          if (invalidOptionMessage) {
              throw new Error(`Invalid options provided. ${invalidOptionMessage}`);
          }
          const options = Object.assign({}, defaultOptions, userOptions);
          return new Promise((resolve, reject) => {
              const file = e.target.files[0];
              if (!file) {
                  const message = options.messages.noFile || defaultOptions.messages.noFile;
                  if (options.showAlert) {
                      alert(message);
                  }
                  reject(message);
                  return;
              }

              const fileSize = file.size / 1024;
              if (fileSize > options.sizeInKbAllowed) {
                  const message = options.messages.fileSize || defaultOptions.messages.fileSize;
                  if (options.showAlert) {
                      alert(message);
                  }
                  reject(message);
                  return;
              }

              if (!options.allowedTypes.includes(file.type)) {
                  const message = options.messages.fileType || defaultOptions.messages.fileType;
                  if (options.showAlert) {
                      alert(message);
                  }
                  reject(message);
                  return;
              }

              if (file.type === "application/pdf") {
                  // PDF Validation
                  const reader = new FileReader();
                  reader.readAsArrayBuffer(file);
                  reader.onload = (event) => {
                      const pdfData = new Uint8Array(event.target.result);
                      const pdfText = new TextDecoder().decode(pdfData);
                      const isPDF = pdfText.includes("%PDF-");
                      if (!isPDF) {
                          const message = options.messages.invalidPdf || defaultOptions.messages.invalidPdf;
                          if (options.showAlert) {
                              alert(message);
                          }
                          reject(message);
                          return;
                      }

                      // Extract the page count
                      const pageCount = getPdfPageCount(pdfText);
                      if (
                          pageCount < options.pdfPageMinCount ||
                          pageCount > options.pdfPageMaxCount
                      ) {
                          const message = options.messages.pdfPageCount || defaultOptions.messages.pdfPageCount;
                          if (options.showAlert) {
                              alert(message);
                          }
                          reject(message);
                          return;
                      }

                      const eofIndex = pdfText.lastIndexOf("%%EOF");
                      if (eofIndex === -1) {
                          const message = options.messages.invalidPdf || defaultOptions.messages.invalidPdf;
                          if (options.showAlert) {
                              alert(message);
                          }
                          reject(message);
                          return;
                      }

                      if (options.customValidations.pdf) {
                          // Apply PDF-specific custom validations
                          for (const validation of options.customValidations.pdf) {
                              const validationResult = validation(file, pdfData, pdfText);
                              if (validationResult !== true) {
                                  if (options.showAlert) {
                                      alert(validationResult);
                                  }
                                  reject(validationResult);
                                  return;
                              }
                          }
                      }

                      resolve(file);
                  };
                  reader.onerror = () => {
                      const message = options.messages.invalidPdf || defaultOptions.messages.invalidPdf;
                      if (options.showAlert) {
                          alert(message);
                      }
                      reject(message);
                  };
              } else if (file.type.startsWith("image/")) {
                  // Image Validation
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = (event) => {
                      const image = new Image();
                      image.src = event.target.result;
                      image.onload = function () {
                          const height = this.height;
                          const width = this.width;
                          if (
                              height > options.heightOfImage ||
                              width > options.widthOfImage
                          ) {
                              const message = options.messages.dimensions || defaultOptions.messages.dimensions;
                              if (options.showAlert) {
                                  alert(message);
                              }
                              reject(message);
                          } else {
                              // Apply image-specific custom validations
                              if (options.customValidations.image) {
                                  for (const validation of options.customValidations.image) {
                                      const validationResult = validation(file, image);
                                      if (validationResult !== true) {
                                          if (options.showAlert) {
                                              alert(validationResult);
                                          }
                                          reject(validationResult);
                                          return;
                                      }
                                  }
                              }
                              resolve(file); // Ensure resolve is called when custom validations pass
                          }
                      };
                  };
              } else {
                  // Unsupported file type
                  const message = options.messages.fileType || defaultOptions.messages.fileType;
                  if (options.showAlert) {
                      alert(message);
                  }
                  reject(message);
              }
          });
      };

      if (isVue3) {
          Vue.config.globalProperties.$validateFile = validateFile;
      } else {
          Vue.prototype.$validateFile = validateFile;
      }
  },
};

export default fileValidationPlugin;
