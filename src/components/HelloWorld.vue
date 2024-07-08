<template>
  <div class="file-upload-container">
    <input
      id="file"
      ref="inputTypeFile"
      class="file-input"
      @change="validateFile"
      type="file"
      :accept="acceptedTypes"
    />
    <label for="file" class="file-label">
      Choose a file
    </label>
    <div v-if="fileError" class="error-message">{{ fileError }}</div>
    <div v-if="file" class="success-message">File is valid: {{ file.name }}</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      acceptedTypes: '.jpeg, .jpg, .png, .pdf', // Specify the accepted types
      file: null,
      fileError: null
    };
  },
  methods: {
    validateFile(event) {
      const options = {
        showAlert: true, // We'll handle errors in our component
        sizeInKbAllowed: 1000, // 10 MB
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        heightOfImage: 2000,
        widthOfImage: 2000  ,
        pdfPageMinCount: 3,
        pdfPageMaxCount: 1,
        messages: {
          noFile: "3",
          fileSize: "File size exceeds the allowed limit.",
          fileType: "Invalid file type.",
          dimensions: "Invalid image dimensions.",
          invalidPdf: "Invalid PDF file.",
          pdfPageCount: "PDF does not meet the required page count.",
        },
        customValidations: {
          image: [
            (file, image) => {
              if (file.name.includes('test')) {
                return "Image file name should not contain 'test'.";
              }
              return true;
            }
          ],
          pdf: [
            (file, pdfData, pdfText) => {
              if (!pdfText.includes('RequiredKeyword')) {
                return "The PDF file does not contain the required keyword.";
              }
              return true;
            }
          ]
        }
      };

      this.$validateFile(event, options).then((file) => {
        console.log(file, 'file')
        this.file = file;
        this.fileError = null;
      }).catch((error) => {
        this.file = null;
        this.fileError = error;
      });
    }
  }
}
</script>

<style>
.file-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.file-input {
  display: none; /* Hide the file input */
}

.file-label {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.success-message {
  color: green;
  margin-top: 10px;
}
</style>
