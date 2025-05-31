export interface TestcaseDetails {
    test_name:string,
    test_status:'success' | 'failure' | "partial success",
    total_steps:number,
    successful_steps:number,
    failed_steps:number,
    conclusion:string
}

export interface FrontendStepReportDetails {
    list_of_testcases: TestcaseDetails[],
    total_number_of_failed_testcases: number,
    total_number_of_passes_testcases: number,
    total_number_of_testcases: number,
}


export interface FrontendReportDetails {
    id: number,
    step_name: string,
    step_report: FrontendStepReportDetails,
    userevaluation_id: number,
}