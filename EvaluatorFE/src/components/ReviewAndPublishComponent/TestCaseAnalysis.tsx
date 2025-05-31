// import { BackendReportDetails } from "../../interfaces/BackendReportDetails";
// import { FrontendReportDetails } from "../../interfaces/FrontendReportDetails";
import BackendTestCaseAnalysis from "./BackendTestCaseAnalysis";
import FrontendTestCaseAnalysis from "./FrontendTestCaseAnalysis";

export default function TestcaseAnalysis(props:{
report: any,
updateHandler?:any
}){

    return <>
    {props.report.step_name == 'backend_test_execution_report' ? <BackendTestCaseAnalysis {...props}/> : <FrontendTestCaseAnalysis {...props}/>}
    </>

}