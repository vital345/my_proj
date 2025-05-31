export interface StepReportDetails {
    overall_score: number,
    report: {
        areas_of_improvement: string[],
        strengths: string[],
        weaknesses: string[],
    },
    final_commit_details?: {
        message: string,
        date: string,
    }
    userevaluation_id: number
}

export interface ReportDetails {
    id: number,
    step_name: string,
    step_report: StepReportDetails
}