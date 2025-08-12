// Components/AllResultsPDFGenerator.js
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import {
  showPermissionDeniedMessage,
  showPermissionErrorMessage,
  showPdfGeneratingMessage,
  showPdfGenerationFailedMessage,
  showFileOpenFallbackMessage,
  hideMessage,
} from '../Components/SubmissionMessage';

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
        showPermissionDeniedMessage();
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Permission Error:', error);
      showPermissionErrorMessage();
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
    return (
      RNFS.DownloadDirectoryPath ||
      RNFS.ExternalStorageDirectoryPath + '/Download'
    );
  }
};

/**
 * Convert asset image to base64 for watermark
 * @returns {Promise<string>} Base64 string of the logo
 */
const getLogoBase64 = async () => {
  try {
    let base64;

    if (Platform.OS === 'android') {
      base64 = await RNFS.readFileAssets('logo.png', 'base64');
    } else {
      const logoPath = `${RNFS.MainBundlePath}/logo.png`;
      base64 = await RNFS.readFile(logoPath, 'base64');
    }

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.warn('Logo not found, proceeding without watermark');
    return null;
  }
};

/**
 * Generate HTML for All Results PDF with watermark
 * @param {Array} resultsData - Results data array
 * @param {Object} testInfo - Test information
 * @param {string} logoBase64 - Base64 string of the logo
 * @returns {string} HTML content with watermark
 */
const generateAllResultsHTMLWithWatermark = (resultsData, testInfo, logoBase64) => {
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
    ? `<img src="${logoBase64}" class="watermark" alt="Watermark" />`
    : '';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const resultsRows = resultsData.map((result, index) => {
    const serialNumber = index + 1;
    
    return `
      <tr style="border-bottom: 1px solid #dee2e6;">
        <td style="padding: 8px; text-align: center; font-weight: 600; border-right: 1px solid #dee2e6;">${serialNumber}</td>
        <td style="padding: 8px; text-align: left; border-right: 1px solid #dee2e6;">${result.userName || 'Anonymous'}</td>
        <td style="padding: 8px; text-align: center; border-right: 1px solid #dee2e6;">${testInfo.totalMarks || 100}</td>
        <td style="padding: 8px; text-align: center; border-right: 1px solid #dee2e6;">${testInfo.noOfQuestions || 100}</td>
        <td style="padding: 8px; text-align: center; font-weight: 600; color: #28a745; border-right: 1px solid #dee2e6;">${result.totalScore || 0}</td>
        <td style="padding: 8px; text-align: center; color: #28a745; border-right: 1px solid #dee2e6;">${result.correctQuestions || 0}</td>
        <td style="padding: 8px; text-align: center; color: #dc3545; border-right: 1px solid #dee2e6;">${result.incorrectQuestions || 0}</td>
        <td style="padding: 8px; text-align: center; color: #6c757d; border-right: 1px solid #dee2e6;">${result.unsolvedQuestions || 0}</td>
        <td style="padding: 8px; text-align: center; color: #17a2b8;">${result.totalTime || '00:00:00'}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Ranking Results</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #ffffff;
                color: #000;
                position: relative;
            }
            
            ${watermarkStyle}
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                position: relative;
                z-index: 2;
            }
            .title {
                font-size: 24px;
                font-weight: bold;
                color: #000;
                margin-bottom: 20px;
                text-decoration: underline;
            }
            .results-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                background-color: white;
                border: 1px solid #dee2e6;
                position: relative;
                z-index: 2;
            }
            .table-header {
                background-color: #4472C4;
                color: white;
                font-weight: bold;
            }
            .table-header th {
                padding: 12px 8px;
                text-align: center;
                border-right: 1px solid #ffffff;
                border-bottom: 1px solid #ffffff;
                font-size: 14px;
            }
            .results-table td {
                font-size: 13px;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #6c757d;
                border-top: 1px solid #dee2e6;
                padding-top: 15px;
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
                <div class="title">Ranking Results</div>
            </div>
            
            <table class="results-table">
                <thead class="table-header">
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Total Marks</th>
                        <th>Questions</th>
                        <th>Score</th>
                        <th>Correct</th>
                        <th>Incorrect</th>
                        <th>Unsolved</th>
                        <th>Total Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${resultsRows}
                </tbody>
            </table>
            
            <div class="footer">
                Generated on: ${new Date().toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Generate PDF with watermark for All Results
 * @param {Array} resultsData - Results data array
 * @param {Object} testInfo - Test information
 * @returns {Promise<string>} File path of generated PDF
 */
const generateAllResultsPDFWithWatermark = async (resultsData, testInfo) => {
  try {
    if (!resultsData || resultsData.length === 0) {
      throw new Error('Results data is required');
    }

    // Get logo for watermark
    const logoBase64 = await getLogoBase64();

    // Generate HTML content
    const htmlContent = generateAllResultsHTMLWithWatermark(resultsData, testInfo, logoBase64);

    // Clean filename
    const cleanTitle = (testInfo.testTitle || 'AllResults')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);

    const fileName = `${cleanTitle}_Results_${Date.now()}`;
    const downloadsPath = getDownloadsPath();

    // Ensure Downloads directory exists
    const dirExists = await RNFS.exists(downloadsPath);
    if (!dirExists) {
      await RNFS.mkdir(downloadsPath);
    }

    // PDF options
    const options = {
      html: htmlContent,
      fileName: fileName,
      directory: Platform.OS === 'ios' ? 'Documents' : 'Downloads',
      width: 612,
      height: 792,
      padding: 20,
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

    // Verify file exists and is not empty
    const fileExists = await RNFS.exists(finalPath);
    if (!fileExists) {
      throw new Error('PDF file was not created successfully');
    }

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
 * Main function to generate and download All Results PDF with watermark
 * @param {Array} resultsData - Results data array
 * @param {Object} testInfo - Test information object
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<string>} File path of generated PDF
 */
export const generateAllResultsPDF = async (resultsData, testInfo, onProgress) => {
  try {
    // Permission request
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      return { success: false, error: 'Storage permission denied' };
    }
    onProgress && onProgress(10);

    // Show loading indicator
    showPdfGeneratingMessage();

    // Generate PDF file
    const filePath = await generateAllResultsPDFWithWatermark(resultsData, testInfo);
    onProgress && onProgress(80);

    // Show success message with option to open file
    showFileOpenFallbackMessage(filePath, () => hideMessage());

    onProgress && onProgress(100);

    return { success: true, filePath, fileName: filePath.split('/').pop() };
  } catch (error) {
    console.error('❌ Download Error:', error);
    showPdfGenerationFailedMessage(error.message);
    return { success: false, error: error.message };
  }
};

export default {
  generateAllResultsPDF,
};
