import { Metadata } from 'next';
import CartClient from './CartClient';

export const metadata: Metadata = {
  title: 'Giỏ hàng của bạn | StudyLab',
  description: 'Xem lại các khóa học bạn đã chọn và tiến hành thanh toán.',
  openGraph: {
    title: 'Giỏ hàng của bạn | StudyLab',
    description: 'Xem lại các khóa học bạn đã chọn và tiến hành thanh toán.',
    url: 'https://studylab.com/cart', // Thay bằng domain thật nếu có
    siteName: 'StudyLab',
    locale: 'vi_VN',
    type: 'website',
  },
};

export default function CartPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: 'https://studylab.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Giỏ hàng',
        item: 'https://studylab.com/cart',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CartClient />
    </>
  );
}
