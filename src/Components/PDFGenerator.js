import RNHTMLtoPDF from 'react-native-html-to-pdf';
import {Platform, PermissionsAndroid, Linking, Alert} from 'react-native';
import RNFS from 'react-native-fs';
import {Image} from 'react-native';

/**
 * Request storage permission for Android devices
 * @returns {Promise<boolean>}
 */
const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const androidVersion = Platform.Version;

      if (androidVersion >= 30) {
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to storage to download the PDF',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Permission Denied',
          'Storage permission is required to download PDF',
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Permission Error:', error);
      Alert.alert('Permission Error', 'Failed to request storage permission');
      return false;
    }
  }
  return true;
};

/**
 * Get the Downloads directory path
 * @returns {string} Downloads directory path
 */
const getDownloadsPath = () => {
  if (Platform.OS === 'ios') {
    return RNFS.DocumentDirectoryPath;
  } else {
    // For Android, use DownloadDirectoryPath to save directly in Downloads
    return (
      RNFS.DownloadDirectoryPath ||
      RNFS.ExternalStorageDirectoryPath + '/Download'
    );
  }
};

/**
 * Convert asset image to base64 for watermark - FIXED VERSION
 * @returns {Promise<string>} Base64 string of the logo
 */
const getLogoBase64 = async () => {
  try {
    let base64;

    if (Platform.OS === 'android') {
      // For Android: assets folder (image name must match exactly)
      base64 = await RNFS.readFileAssets('logo.png', 'base64'); // Use full filename
    } else {
      // For iOS: image must be accessible in the bundle
      const logoPath = `${RNFS.MainBundlePath}/logo.png`;
      base64 = await RNFS.readFile(logoPath, 'base64');
    }

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    return null;
  }
};

/**
 * Generate HTML with watermark
 * @param {Object} testPaper - Test paper object
 * @param {string} logoBase64 - Base64 string of the logo
 * @returns {string} HTML content with watermark
 */
const generateHTMLWithWatermark = (testPaper, logoBase64) => {
  const watermarkStyle = logoBase64
    ? `
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      opacity: 0.1;
      z-index: 1300;
      width: 600px;
      height: auto;
      pointer-events: none;
    }
    
    .watermark-container {
      position: relative;
      z-index: 1;
    }
  `
    : '';

  const watermarkElement = logoBase64
    ? `
    <img src="${logoBase64}" class="watermark" alt="Watermark" />
  `
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Test Paper</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          line-height: 1.6;
          position: relative;
        }
        
        ${watermarkStyle}
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          position: relative;
          z-index: 2;
        }
        
        .header h1 {
          color: #333;
          font-size: 24px;
          margin-bottom: 10px;
        }
        
        .info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          position: relative;
          z-index: 2;
        }
        
        .info-left, .info-right {
          flex: 1;
        }
        
        .info-right {
          text-align: right;
        }
        
        .question {
        
          margin: 0 0 20px 0;
          padding: 10px 15px;          
          border-left: 3px solid #007bff;
          background-color: rgba(0, 123, 255, 0.05);
          position: relative;
          z-index: 2;
          page-break-inside: avoid;
        }
        
        .question-text {
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }

        .content {
          padding-top: 10px;
        }
        
        .option {
          margin-left: 20px;
          margin-bottom: 8px;
          padding: 5px 0;
            page-break-inside: avoid;

        }
        
        .option-letter {
          font-weight: bold;
          color: #007bff;
          margin-right: 10px;
        }
        
        .instructions {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          position: relative;
          z-index: 2;
        }
        
        .instructions h3 {
          margin-top: 0;
          color: #495057;
        }
        
        .instructions ul {
          margin-bottom: 0;
        }
        
        .instructions li {
          margin-bottom: 5px;
        }
        
        hr {
          border: 0;
          height: 1px;
          background: #ddd;
          margin: 20px 0;
        }
        
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
          position: relative;
          z-index: 2;
        }
        
        @media print {
          .watermark {
            opacity: 0.08;
          }
        }
      </style>
    </head>
    <body>
      ${watermarkElement}
      
      <div class="watermark-container">
        <div class="header">
          <h1>${testPaper.testTitle || 'Test Paper'}</h1>
          <p style="color: #666; font-size: 14px;">Please read all instructions carefully before starting</p>
        </div>
        
        <div class="info">
          <div class="info-left">
            <p><strong>Name: ____________________</strong></p>
            <p><strong>Roll No.: ________________</strong></p>
            <p><strong>Date: ____________________</strong></p>
          </div>
          <div class="info-right">
            <p><strong>Duration: ${
              testPaper.duration || 'N/A'
            } minutes</strong></p>
            <p><strong>Total Marks: ${
              testPaper.totalMarks || 'N/A'
            }</strong></p>
            <p><strong>Total Questions: ${
              testPaper.noOfQuestions || 'N/A'
            }</strong></p>
          </div>
        </div>
        
        <div class="instructions">
          <h3>Instructions:</h3>
          <ul>
            <li>Read each question carefully before answering</li>
            <li>Choose the best answer from the given options</li>
            <li>Mark your answers clearly</li>
            <li>Manage your time effectively</li>
            <li>Review your answers before submitting</li>
          </ul>
        </div>
        
        <hr>
        
        <div class="content">
          ${generateQuestionsHTML(testPaper.questions || [])}
        </div>
        
        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()} }</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate questions HTML
 * @param {Array} questions - Array of question objects
 * @returns {string} HTML for questions
 */
const generateQuestionsHTML = questions => {
  if (!questions || questions.length === 0) {
    return '<div style="text-align: center; color: #666; font-style: italic; padding: 40px;">Questions will be available soon.</div>';
  }

  return questions
    .map((question, index) => {
      const questionText = question.createQuestion || `Question ${index + 1}`;
      const options = ['A', 'B', 'C', 'D', 'E']
        .map(opt => {
          const optValue = question[`option${opt}`];
          return optValue && optValue.trim()
            ? `
          <div class="option">
            <span class="option-letter">${opt}.</span>${optValue}
          </div>
        `
            : '';
        })
        .join('');

      return `
      <div class="question">
        <div class="question-text">${index + 1}. ${questionText}</div>
        ${options}
      </div>
    `;
    })
    .join('');
};

/**
 * Enhanced PDF generation with watermark
 * @param {Object} testPaper - Test paper object
 * @returns {Promise<string>} File path of generated PDF
 */
const generatePDFWithWatermark = async testPaper => {
  try {
    if (!testPaper) {
      throw new Error('Test paper data is required');
    }
    const logoBase64 = await getLogoBase64();

    const htmlContent = generateHTMLWithWatermark(testPaper, logoBase64);

    // Clean filename
    const cleanTitle = (testPaper.testTitle || 'TestPaper')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);

    const fileName = `${cleanTitle}_${Date.now()}`;
    const downloadsPath = getDownloadsPath();
    // Ensure Downloads directory exists
    const dirExists = await RNFS.exists(downloadsPath);

    if (!dirExists) {
      await RNFS.mkdir(downloadsPath);
    }

    // PDF options optimized for Downloads folder
    const options = {
      html: htmlContent,
      fileName: fileName,
      directory: Platform.OS === 'ios' ? 'Documents' : 'Downloads',
      width: 612,
      height: 792,
      padding: 30,
      bgColor: '#FFFFFF',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    };


    // Generate PDF
    const file = await RNHTMLtoPDF.convert(options);

    if (!file || !file.filePath) {
      throw new Error('PDF generation failed - no file path returned');
    }

    // For Android, ensure the file is in the Downloads folder
    let finalPath = file.filePath;

    if (Platform.OS === 'android' && !finalPath.includes('/Download/')) {
      const newPath = `${downloadsPath}/${fileName}.pdf`;

      try {
        await RNFS.moveFile(file.filePath, newPath);
        finalPath = newPath;
      } catch (moveError) {
        console.warn('⚠️ Could not move file to Downloads folder:', moveError);
      }
    }

    const fileExists = await RNFS.exists(finalPath);

    if (!fileExists) {
      throw new Error('PDF file was not created successfully');
    }

    // Get file stats
    const fileStats = await RNFS.stat(finalPath);

    if (fileStats.size === 0) {
      throw new Error('Generated PDF file is empty');
    }

    return finalPath;
  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    throw error;
  }
};

/**
 * Open file using system default application - IMPROVED VERSION
 * @param {string} filePath - Path to the file
 */
const openFile = async filePath => {
  try {

    const fileExists = await RNFS.exists(filePath);
    if (!fileExists) {
      console.error('❌ File not found:', filePath);
      Alert.alert('Error', 'File not found');
      return;
    }

    let fileUrl;
    if (Platform.OS === 'ios') {
      fileUrl = `file://${filePath}`;
    } else {
      // Android - use content:// scheme for better compatibility
      fileUrl = `file://${filePath}`;
    }

    const supported = await Linking.canOpenURL(fileUrl);

    if (supported) {
      await Linking.openURL(fileUrl);
    } else {
      Alert.alert(
        'PDF Generated Successfully',
        `PDF saved to Downloads folder:\n${filePath}\n\nPlease open your file manager to view the PDF.`,
        [{text: 'OK', style: 'default'}],
      );
    }
  } catch (error) {
    console.error('❌ Error opening file:', error);
    Alert.alert(
      'PDF Generated Successfully',
      `File saved to Downloads folder:\n${filePath}\n\nPlease open your file manager to view the PDF.`,
      [{text: 'OK', style: 'default'}],
    );
  }
};

/**
 * Main function to generate and download PDF for test paper with watermark
 * @param {Object} testPaper - Test paper object containing questions and details
 * @returns {Promise<void>}
 */
export const generateAndDownloadTestPaper = async testPaper => {
  try {

    // Request storage permission
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      return;
    }

    // Show loading indicator
    Alert.alert(
      'Generating PDF...',
      'Please wait while we prepare your test paper.',
    );

    try {
      // Generate PDF with watermark
      const filePath = await generatePDFWithWatermark(testPaper);

      Alert.alert(
        'PDF Generated Successfully',
        `PDF saved to Downloads folder:\n${filePath}`,
        [
          {
            text: 'Open PDF',
            onPress: () => openFile(filePath),
          },
          {
            text: 'OK',
            style: 'default',
          },
        ],
      );

    } catch (pdfError) {
      console.error('❌ PDF generation failed:', pdfError);
      throw pdfError;
    }
  } catch (error) {
    console.error('❌ Download Error:', error);

    let errorMessage = 'Unable to generate the test paper. Please try again.';

    if (error.message?.includes('Permission')) {
      errorMessage =
        'Storage permission is required. Please grant permission and try again.';
    } else if (
      error.message?.includes('network') ||
      error.message?.includes('Network')
    ) {
      errorMessage =
        'Network error occurred. Please check your connection and try again.';
    } else if (
      error.message?.includes('space') ||
      error.message?.includes('storage')
    ) {
      errorMessage =
        'Insufficient storage space. Please free up some space and try again.';
    }

    Alert.alert(
      'Generation Failed',
      errorMessage +
        '\n\nTechnical details: ' +
        (error.message || 'Unknown error'),
    );
  }
};

/**
 * Test function to check if PDF generation with watermark is working
 * @returns {Promise<void>}
 */
export const testPDFGeneration = async () => {
  try {
    // Create a simple test data
    const testData = {
      id: 'test_001',
      testTitle: 'Sample Test Paper',
      duration: '60',
      totalMarks: '100',
      noOfQuestions: '2',
      questions: [
        {
          createQuestion: 'What is the capital of France?',
          optionA: 'London',
          optionB: 'Berlin',
          optionC: 'Paris',
          optionD: 'Madrid',
        },
        {
          createQuestion: 'What is 2 + 2?',
          optionA: '3',
          optionB: '4',
          optionC: '5',
          optionD: '6',
        },
      ],
    };

    await generateAndDownloadTestPaper(testData);
  } catch (error) {
    console.error('❌ Test failed:', error);
    Alert.alert('Test Failed', error.message);
  }
};

/**
 * Alternative function to download PDF from URL
 * @param {string} pdfUrl - URL to the PDF file
 * @param {string} fileName - Name for the downloaded file
 */
export const downloadPDFFromUrl = async (pdfUrl, fileName) => {
  try {

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      return;
    }

    const cleanFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
    const downloadsPath = getDownloadsPath();
    const downloadDest = `${downloadsPath}/${cleanFileName}.pdf`;

    Alert.alert('Downloading...', 'Please wait while we download your PDF.');

    const options = {
      fromUrl: pdfUrl,
      toFile: downloadDest,
      headers: {
        'User-Agent': 'TestPaperApp/1.0',
      },
    };

    const result = await RNFS.downloadFile(options).promise;

    if (result.statusCode === 200) {
      Alert.alert(
        'Download Complete',
        `PDF saved to Downloads folder:\n${downloadDest}`,
        [
          {
            text: 'Open PDF',
            onPress: () => openFile(downloadDest),
          },
          {
            text: 'OK',
            style: 'default',
          },
        ],
      );
    } else {
      throw new Error(`Download failed with status: ${result.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Download Error:', error);
    Alert.alert(
      'Download Failed',
      'Unable to download the PDF. Please try again.',
    );
  }
};

// Export functions
export default {
  generateAndDownloadTestPaper,
  downloadPDFFromUrl,
  testPDFGeneration,
};
