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
                pdfPageCount: "PDF does not meet the required page count.",
                missingImages: "PDF does not contain required images."
            },
            customValidations: {
                image: [],
                pdf: [],
            },
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
            const options = Object.assign({}, defaultOptions, userOptions);
            return new Promise((resolve, reject) => {
                const file = e.target.files[0];
                if (!file) {
                    if (options.showAlert) {
                        alert(options.messages.noFile);
                    }
                    reject("NO_FILE_SELECTED");
                    return;
                }

                const fileSize = file.size / 1024;
                if (fileSize > options.sizeInKbAllowed) {
                    if (options.showAlert) {
                        alert(options.messages.fileSize);
                    }
                    reject(options.messages.fileSize);
                    return;
                }

                if (!options.allowedTypes.includes(file.type)) {
                    if (options.showAlert) {
                        alert(options.messages.fileType);
                    }
                    reject(options.messages.fileType);
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
                            if (options.showAlert) {
                                alert(options.messages.invalidPdf);
                            }
                            reject(options.messages.invalidPdf);
                            return;
                        }

                        // Extract the page count
                        const pageCount = getPdfPageCount(pdfText);
                        if (
                            pageCount < options.pdfPageMinCount ||
                            pageCount > options.pdfPageMaxCount
                        ) {
                            if (options.showAlert) {
                                alert(options.messages.pdfPageCount);
                            }
                            reject(options.messages.pdfPageCount);
                            return;
                        }

                        const eofIndex = pdfText.lastIndexOf("%%EOF");
                        if (eofIndex === -1) {
                            if (options.showAlert) {
                                alert(options.messages.invalidPdf);
                            }
                            reject(options.messages.invalidPdf);
                            return;
                        }

                        if (options.customValidations.pdf) {
                            // Apply PDF-specific custom validations
                            for (const validation of options.customValidations
                                .pdf) {
                                const validationResult = validation(
                                    file,
                                    pdfData,
                                    pdfText
                                );
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
                        if (options.showAlert) {
                            alert(options.messages.invalidPdf);
                        }
                        reject(options.messages.invalidPdf);
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
                                if (options.showAlert) {
                                    alert(options.messages.dimensions);
                                }
                                reject(options.messages.dimensions);
                            } else {
                                // Apply image-specific custom validations
                                if (options.customValidations.image) {
                                    for (const validation of options
                                        .customValidations.image) {
                                        const validationResult = validation(
                                            file,
                                            image
                                        );
                                        if (validationResult !== true) {
                                            if (options.showAlert) {
                                                alert(validationResult);
                                            }
                                            reject(validationResult);
                                            return;
                                        }
                                    }
                                    resolve(file);
                                }
                            }
                        };
                    };
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
