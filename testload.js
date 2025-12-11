import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1000, // số lượng người dùng ảo chạy song song
  duration: '30s', // thời gian test (30 giây)
};

export default function () {
  const res = http.get('http://localhost:3001/course'); // endpoint GET /course

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
