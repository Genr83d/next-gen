import { jsPDF } from 'jspdf';

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
  const { width = 260, lineHeight = 16 } = options;
  const safeValue = value || 'N/A';
  doc.setFont('helvetica', 'bold');
  doc.text(label, startX, startY);
  doc.setFont('helvetica', 'normal');
  const wrapped = doc.splitTextToSize(String(safeValue), width);
  doc.text(wrapped, startX + 150, startY);
  return startY + wrapped.length * lineHeight;
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
    return { dataUrl: '', state: 'missing' };
  }
  try {
    const image = await loadImage(source);
    return { dataUrl: imageToPngDataUrl(image), state: 'ok' };
  } catch (error) {
    return { dataUrl: '', state: 'error' };
  }
};

const renderStudentPhoto = async (doc, dataUrl, state, startX, startY) => {
  const boxWidth = 140;
  const boxHeight = 180;

  doc.setFont('helvetica', 'bold');
  doc.text('Student Photo', startX, startY);
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(1);
  const boxY = startY + 10;
  doc.rect(startX, boxY, boxWidth, boxHeight);

  if (dataUrl) {
    doc.addImage(dataUrl, 'PNG', startX, boxY, boxWidth, boxHeight, undefined, 'FAST');
  } else {
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(
      state === 'error' ? 'Photo unavailable' : 'No photo provided',
      startX + 10,
      boxY + boxHeight / 2
    );
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
  }

  return boxY + boxHeight + 12;
};

export const generateRegistrationPdf = async (data) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 52;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('NEXT-GEN ACADEMY', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Powered by GENR8-3D Ltd', margin, y + 14);

  doc.setDrawColor(255, 106, 0);
  doc.setLineWidth(2);
  doc.line(margin, y + 24, pageWidth - margin, y + 24);

  y += 52;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Student Registration Form', margin, y);

  const dateText = `Date: ${formatDate(new Date())}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), y);

  y += 28;
  doc.setFontSize(11);

  y = renderField(doc, 'Student First Name', data.firstName, margin, y);
  y = renderField(doc, 'Student Last Name', data.lastName, margin, y + 4);
  y = renderField(doc, 'Date of Birth', formatDob(data.dob), margin, y + 4);
  y = renderField(doc, 'Gender', data.genderLabel, margin, y + 4);
  y = renderField(doc, 'Address', data.address, margin, y + 4, { width: 300 });
  y = renderField(doc, 'Phone', data.phone, margin, y + 4);
  y = renderField(doc, 'Email', data.email, margin, y + 4);
  y = renderField(doc, 'School', data.school, margin, y + 4);

  const photoData = await resolvePhotoDataUrl(data.studentPhoto?.url);
  y = await renderStudentPhoto(doc, photoData.dataUrl, photoData.state, margin, y + 16);

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Course Selection', margin, y);
  doc.setFont('helvetica', 'normal');
  const courseText = data.courses?.length
    ? data.courses.map((course) => `- ${course.title}`).join('\n')
    : 'N/A';
  const courseLines = doc.splitTextToSize(courseText, 360);
  doc.text(courseLines, margin, y + 16);
  y += courseLines.length * 16 + 12;

  y = renderField(doc, 'Preferred Schedule', data.scheduleLabel, margin, y + 4, { width: 300 });
  y = renderField(doc, 'Emergency Contact', data.emergencyName, margin, y + 4);
  y = renderField(doc, 'Emergency Phone', data.emergencyPhone, margin, y + 4);

  if (data.guardianName) {
    y = renderField(doc, 'Guardian Name', data.guardianName, margin, y + 4);
  }

  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.text('Signature', margin, y);
  doc.setFont('helvetica', 'normal');

  if (data.signatureDrawn) {
    doc.addImage(data.signatureDrawn, 'PNG', margin, y + 12, 180, 60);
    doc.text('Signature provided digitally', margin + 200, y + 38);
    y += 80;
  } else if (data.signatureTyped) {
    doc.text(data.signatureTyped, margin, y + 24);
    doc.line(margin, y + 28, margin + 240, y + 28);
    y += 40;
  } else {
    doc.text('No signature provided', margin, y + 24);
    y += 40;
  }

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This form confirms enrollment interest for NEXT-GEN ACADEMY and will be reviewed by admissions staff.',
    margin,
    y + 12
  );

  return doc;
};
