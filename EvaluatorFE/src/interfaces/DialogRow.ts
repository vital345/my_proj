export interface TestCase {
  id: number;
  request_url: string;
  request_body:string;
  response_body: string;
  remarks:string;
  request_method:string;
  response_status_code: number;
}