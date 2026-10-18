import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<45'], // 95% of requests must complete below 45ms
  },
};

export default function () {
  const res = http.get('http://localhost:4000/api/projects/sample-id/tasks');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
