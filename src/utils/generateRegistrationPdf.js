import { jsPDF } from 'jspdf';

const COLORS = {
  primary: [255, 106, 0],
  primaryLight: [255, 237, 213],
  primaryDark: [124, 45, 18],
  ink: [17, 24, 39],
  slate: [100, 116, 139],
  line: [226, 232, 240],
  surface: [248, 250, 252],
  white: [255, 255, 255],
};

const setTextColor = (doc, color) => doc.setTextColor(...color);

const formatDate = (date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatDob = (dob) => {
  if (!dob) return '';
  const parsed = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dob;
  return formatDate(parsed);
};

const renderField = (doc, label, value, startX, startY, options = {}) => {
  const {
    width = 260,
    lineHeight = 14,
    labelSize = 8,
    valueSize = 11,
    valueGap = 10,
    divider = true,
  } = options;
  const safeValue = value || 'N/A';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(labelSize);
  setTextColor(doc, COLORS.slate);
  doc.text(label.toUpperCase(), startX, startY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(valueSize);
  setTextColor(doc, COLORS.ink);
  const wrapped = doc.splitTextToSize(String(safeValue), width);
  const valueY = startY + valueGap;
  doc.text(wrapped, startX, valueY);

  let nextY = valueY + (wrapped.length - 1) * lineHeight + 10;
  if (divider) {
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.5);
    doc.line(startX, nextY, startX + width, nextY);
    nextY += 10;
  }

  return nextY;
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load image.'));
    image.src = src;
  });

const imageToPngDataUrl = (image) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
};

const resolvePhotoDataUrl = async (source) => {
  if (!source || typeof source !== 'string') {
    return { dataUrl: '', state: 'missing', width: 0, height: 0 };
  }
  try {
    const image = await loadImage(source);
    return {
      dataUrl: imageToPngDataUrl(image),
      state: 'ok',
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    };
  } catch (error) {
    return { dataUrl: '', state: 'error', width: 0, height: 0 };
  }
};

const renderStudentPhoto = async (doc, dataUrl, state, startX, startY, options = {}) => {
  const {
    boxWidth = 150,
    boxHeight = 190,
    imageWidth = 0,
    imageHeight = 0,
  } = options;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setTextColor(doc, COLORS.slate);
  doc.text('STUDENT PHOTO', startX, startY);
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.8);
  const boxY = startY + 10;
  doc.rect(startX, boxY, boxWidth, boxHeight);

  if (dataUrl) {
    let drawWidth = boxWidth;
    let drawHeight = boxHeight;
    if (imageWidth && imageHeight) {
      const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
      drawWidth = imageWidth * scale;
      drawHeight = imageHeight * scale;
    }
    const imgX = startX + (boxWidth - drawWidth) / 2;
    const imgY = boxY + (boxHeight - drawHeight) / 2;
    doc.addImage(dataUrl, 'PNG', imgX, imgY, drawWidth, drawHeight, undefined, 'FAST');
  } else {
    doc.setFontSize(9);
    setTextColor(doc, COLORS.slate);
    doc.text(
      state === 'error' ? 'Photo unavailable' : 'No photo provided',
      startX + 10,
      boxY + boxHeight / 2
    );
    doc.setFontSize(11);
    setTextColor(doc, COLORS.ink);
  }

  return boxY + boxHeight + 12;
};

const drawHeader = (doc, pageWidth, margin, dateText) => {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 82, 'F');
  setTextColor(doc, COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('NEXT-GEN ACADEMY', margin, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Student Registration Form', margin, 50);
  doc.setFontSize(9);
  doc.text('Powered by GENR8-3D Ltd', margin, 66);
  doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), 32);
  setTextColor(doc, COLORS.ink);
  return 98;
};

const drawSectionHeader = (doc, title, startX, startY, width) => {
  doc.setFillColor(...COLORS.primaryLight);
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.6);
  doc.rect(startX, startY, width, 20, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setTextColor(doc, COLORS.primaryDark);
  doc.text(title, startX + 8, startY + 14);
  setTextColor(doc, COLORS.ink);
  return startY + 28;
};

const renderCourseList = (doc, courses, startX, startY, width) => {
  const listText = courses?.length
    ? courses.map((course) => `- ${course.title}`).join('\n')
    : 'N/A';
  const lines = doc.splitTextToSize(listText, width - 16);
  const boxHeight = lines.length * 14 + 16;
  doc.setFillColor(...COLORS.surface);
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.6);
  doc.rect(startX, startY, width, boxHeight, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  setTextColor(doc, COLORS.ink);
  doc.text(lines, startX + 8, startY + 12);
  return startY + boxHeight + 12;
};

const renderSignatureBlock = (doc, data, startX, startY, width) => {
  const boxHeight = 76;
  doc.setFillColor(...COLORS.surface);
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.6);
  doc.rect(startX, startY, width, boxHeight, 'FD');

  if (data.signatureDrawn) {
    doc.addImage(data.signatureDrawn, 'PNG', startX + 10, startY + 12, 160, 50);
    doc.setFontSize(9);
    setTextColor(doc, COLORS.slate);
    doc.text('Signature provided digitally', startX + 180, startY + 40);
  } else if (data.signatureTyped) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    setTextColor(doc, COLORS.ink);
    doc.text(data.signatureTyped, startX + 10, startY + 40);
    doc.setDrawColor(...COLORS.slate);
    doc.setLineWidth(0.8);
    doc.line(startX + 10, startY + 48, startX + 240, startY + 48);
  } else {
    doc.setFontSize(10);
    setTextColor(doc, COLORS.slate);
    doc.text('No signature provided', startX + 10, startY + 40);
  }

  setTextColor(doc, COLORS.ink);
  return startY + boxHeight + 12;
};

export const generateRegistrationPdf = async (data) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const dateText = `Date: ${formatDate(new Date())}`;
  const contentWidth = pageWidth - margin * 2;
  let y = drawHeader(doc, pageWidth, margin, dateText);

  y = drawSectionHeader(doc, 'Student Information', margin, y, contentWidth);

  const columnGap = 16;
  const photoBoxWidth = 150;
  const leftColumnWidth = contentWidth - photoBoxWidth - columnGap;
  let leftY = y;

  leftY = renderField(doc, 'Student First Name', data.firstName, margin, leftY, {
    width: leftColumnWidth,
  });
  leftY = renderField(doc, 'Student Last Name', data.lastName, margin, leftY, {
    width: leftColumnWidth,
  });
  leftY = renderField(doc, 'Date of Birth', formatDob(data.dob), margin, leftY, {
    width: leftColumnWidth,
  });
  leftY = renderField(doc, 'Gender', data.genderLabel, margin, leftY, {
    width: leftColumnWidth,
  });
  leftY = renderField(doc, 'Address', data.address, margin, leftY, {
    width: leftColumnWidth,
  });
  leftY = renderField(doc, 'Phone', data.phone, margin, leftY, {
    width: leftColumnWidth,
  });
  leftY = renderField(doc, 'Email', data.email, margin, leftY, {
    width: leftColumnWidth,
  });
  leftY = renderField(doc, 'School', data.school, margin, leftY, {
    width: leftColumnWidth,
  });

  const photoSource = data.studentPhoto?.dataUrl || data.studentPhoto?.url;
  const photoData = await resolvePhotoDataUrl(photoSource);
  const photoY = await renderStudentPhoto(
    doc,
    photoData.dataUrl,
    photoData.state,
    margin + leftColumnWidth + columnGap,
    y,
    {
      boxWidth: photoBoxWidth,
      boxHeight: 190,
      imageWidth: photoData.width,
      imageHeight: photoData.height,
    }
  );

  y = Math.max(leftY, photoY) + 6;

  y = drawSectionHeader(doc, 'Course Selection', margin, y, contentWidth);
  y = renderCourseList(doc, data.courses, margin, y, contentWidth);
  y = renderField(doc, 'Preferred Schedule', data.scheduleLabel, margin, y, {
    width: contentWidth,
  });

  y = drawSectionHeader(doc, 'Emergency Contact', margin, y, contentWidth);
  y = renderField(doc, 'Emergency Contact', data.emergencyName, margin, y, {
    width: contentWidth,
  });
  y = renderField(doc, 'Emergency Phone', data.emergencyPhone, margin, y, {
    width: contentWidth,
  });

  if (data.guardianName) {
    y = renderField(doc, 'Guardian Name', data.guardianName, margin, y, {
      width: contentWidth,
    });
  }

  y = drawSectionHeader(doc, 'Signature', margin, y, contentWidth);
  y = renderSignatureBlock(doc, data, margin, y, contentWidth);

  doc.setFontSize(9);
  setTextColor(doc, COLORS.slate);
  doc.text(
    'This form confirms enrollment interest for NEXT-GEN ACADEMY and will be reviewed by admissions staff.',
    margin,
    y + 4
  );

  return doc;
};
