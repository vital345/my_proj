export interface TestcaseDetails {
    remarks: string,
    request_body: string,
    request_method: string,
    request_url: string,
    response_body: string,
    response_status_code: number,
}

export interface BackendStepReportDetails {
    list_of_testcases: TestcaseDetails[],
    total_number_of_failed_testcases: number,
    total_number_of_passes_testcases: number,
    total_number_of_testcases: number,
}

export interface BackendReportDetails {
    id: number,
    step_name: string,
    step_report: BackendStepReportDetails,
    userevaluation_id: number,
}