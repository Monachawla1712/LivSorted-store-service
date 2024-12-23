import * as XLSX from 'xlsx';
import axios from 'axios';

export const xlsx = async (fileName: string) => {
  const req = {
    url: `${process.env.INTERNAL_BASE_URL}/util/media/internal/private/${fileName}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.INTERNAL_TOKEN}`,
    },
    timeout: 10000,
    strictSSL: false,
  };

  // Internal call for get xlsx file
  const url: any = await axios(req);

  const res = await axios.get(url.data.uri, { responseType: 'arraybuffer' });

  /* res.data is a Buffer */
  const workbook = XLSX.read(res.data);

  // Convert the XLSX to JSON
  const worksheets = {};
  const data = [];
  for (const sheetName of workbook.SheetNames) {
    worksheets[sheetName] = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheetName],
    );
    data.push(XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]));
  }
  return data[0];
};
