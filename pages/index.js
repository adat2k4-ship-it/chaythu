// pages/index.js
import fs from 'fs';
import path from 'path';

export default function Home({ htmlContent }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'public', 'index.html');
  const htmlContent = fs.readFileSync(filePath, 'utf8');
  return { props: { htmlContent } };
}