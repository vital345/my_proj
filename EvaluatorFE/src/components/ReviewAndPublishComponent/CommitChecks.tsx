import React, { useState } from 'react';
import { Card, CardContent, Typography, Divider, Box, Button, List, ListItem, ListItemText, FormHelperText } from '@mui/material';
import { ReportDetails, StepReportDetails } from '../../interfaces/ReportDetails';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import EditableList from './components/EditableList';
import { ScoreComponent } from './components/ScoreComponent';
// import EditableList from './EditableList';

interface Props {
  report: ReportDetails;
  updateHandler?: (stepName: string, updateDetails: StepReportDetails) => Promise<void>;
}

const CommitChecks: React.FC<Props> = ({ report, updateHandler }) => {
  const { strengths, weaknesses, areas_of_improvement } = report.step_report.report;
  const { message, date } = report.step_report.final_commit_details ?? { message: "no message", date: "no date" };

  const [fieldErrors, setFieldErrors] = useState({
    strengths: false,
    weaknesses: false,
    areasOfImprovement: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedStrengths, setEditedStrengths] = useState<string[]>(strengths);
  const [editedWeaknesses, setEditedWeaknesses] = useState<string[]>(weaknesses);
  const [editedAreasOfImprovement, setEditedAreasOfImprovement] = useState<string[]>(areas_of_improvement);
  const [editedScore, setEditedScore] = useState<number>(report.step_report.overall_score);
  const [scoreError, setScoreError] = useState<string>('');

  // Original states to revert changes on cancel
  const [originalStrengths, setOriginalStrengths] = useState<string[]>(strengths);
  const [originalWeaknesses, setOriginalWeaknesses] = useState<string[]>(weaknesses);
  const [originalAreasOfImprovement, setOriginalAreasOfImprovement] = useState<string[]>(areas_of_improvement);
  const [originalScore, setOriginalScore] = useState<number>(report.step_report.overall_score);

  const handleEditClick = () => {
    setIsEditing(true);
    // Save the current state as original state
    setOriginalStrengths(editedStrengths);
    setOriginalWeaknesses(editedWeaknesses);
    setOriginalAreasOfImprovement(editedAreasOfImprovement);
    setOriginalScore(editedScore);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    // Revert to the original state
    setEditedStrengths(originalStrengths);
    setEditedWeaknesses(originalWeaknesses);
    setEditedAreasOfImprovement(originalAreasOfImprovement);
    setEditedScore(originalScore);
    setFieldErrors({ strengths: false, weaknesses: false, areasOfImprovement: false });
  };

  const handleSave = () => {
    if (!validateFields()) {
        return; // Do not proceed if validation fails
    }
    setIsEditing(false);
    // Handle submit logic here
    const updatedDetails: StepReportDetails = {
      overall_score: editedScore,
      report: {
        strengths: editedStrengths,
        weaknesses: editedWeaknesses,
        areas_of_improvement: editedAreasOfImprovement
      },
      userevaluation_id: report.step_report.userevaluation_id,
      final_commit_details: report.step_report.final_commit_details
    }
    // console.log('Submitted:', { editedStrengths, editedWeaknesses, editedAreasOfImprovement, editedScore });
    if(updateHandler)
    updateHandler("commit_message_evaluation_report", updatedDetails).then(
      res => console.log(res)
    ).catch(
      err => console.error(err)
    )
  };

  const handleAddItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, '']);
  };

  const handleRemoveItem = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleChangeItem = (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.map((item, i) => (i === index ? value : item)));
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value > 10) {
      setScoreError('Score cannot be more than 10');
    } else if ( value < 0) {
      setScoreError('Score cannot be less than 0');
    } else {
      setScoreError('');
    }
    setEditedScore(value);
  };

  const validateFields = () => {
    const isStrengthsValid = editedStrengths.every((item) => item.trim() !== '');
    const isWeaknessesValid = editedWeaknesses.every((item) => item.trim() !== '');
    const isAreasOfImprovementValid = editedAreasOfImprovement.every((item) => item.trim() !== '');

    setFieldErrors({
      strengths: !isStrengthsValid,
      weaknesses: !isWeaknessesValid,
      areasOfImprovement: !isAreasOfImprovementValid,
    });

    return isStrengthsValid && isWeaknessesValid && isAreasOfImprovementValid;
  };

  return (
    <Card sx={{ mx: 'auto', borderRadius: 2, p: 2 }}>
      <CardContent>
        {/* Header with Overall Score */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, height: '2rem' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
            Commit Report
          </Typography>
          {isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <ScoreComponent editedScore={editedScore} handleScoreChange={handleScoreChange} scoreError={scoreError}/>
            {scoreError && (
              <FormHelperText error sx={{ fontSize: '0.875rem' }}>
                {scoreError}
              </FormHelperText>
            )}
            </Box>
          ) : (
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#000' }}>
              {editedScore}/10
            </Typography>
          )}
        </Box>

        <Typography variant="h6" sx={{ color: '#444' }}>
          Final Commit Details:
        </Typography>
        <List dense>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary={`Last Commit Time: ${(new Date(date)).toLocaleString()}`} sx={{ color: '#555' }} />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary={`Commit Message: ${message}`} sx={{ color: '#555' }} />
          </ListItem>
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Strengths Section */}
        <EditableList
          title="Strengths"
          items={editedStrengths}
          isEditing={isEditing}
          onAddItem={() => handleAddItem(setEditedStrengths)}
          onRemoveItem={(index) => handleRemoveItem(index, setEditedStrengths)}
          onChangeItem={(index, value) => handleChangeItem(index, value, setEditedStrengths)}
          error={fieldErrors.strengths}
        />
        {fieldErrors.strengths && (
          <FormHelperText error sx={{ fontSize: '0.875rem' }}>
            Strengths cannot have empty values.
          </FormHelperText>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Weaknesses Section */}
        <EditableList
          title="Weaknesses"
          items={editedWeaknesses}
          isEditing={isEditing}
          onAddItem={() => handleAddItem(setEditedWeaknesses)}
          onRemoveItem={(index) => handleRemoveItem(index, setEditedWeaknesses)}
          onChangeItem={(index, value) => handleChangeItem(index, value, setEditedWeaknesses)}
          error={fieldErrors.weaknesses}
        />
        {fieldErrors.weaknesses && (
          <FormHelperText error sx={{ fontSize: '0.875rem' }}>
            Weaknesses cannot have empty values.
          </FormHelperText>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Areas of Improvement Section */}
        <EditableList
          title="Areas of Improvement"
          items={editedAreasOfImprovement}
          isEditing={isEditing}
          onAddItem={() => handleAddItem(setEditedAreasOfImprovement)}
          onRemoveItem={(index) => handleRemoveItem(index, setEditedAreasOfImprovement)}
          onChangeItem={(index, value) => handleChangeItem(index, value, setEditedAreasOfImprovement)}
          error={fieldErrors.areasOfImprovement}
        />
        {fieldErrors.areasOfImprovement && (
          <FormHelperText error sx={{ fontSize: '0.875rem' }}>
            Areas of Improvement cannot have empty values.
          </FormHelperText>
        )}

        {updateHandler && <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          {isEditing ? (
            <>
              <Button
                variant="contained"
                startIcon={<CancelIcon />}
                onClick={handleCancelClick}
                sx={{
                  backgroundColor: '#ff6666', // Default lighter red
                  '&:hover': {
                    backgroundColor: '#cc0000', // Deeper red on hover
                  },
                  mr: 1,
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                sx={{ 
                  mr: 1,
                  boxShadow: '0',
                  backgroundColor: '#44a3b8',
                  '&:hover': {backgroundColor: '#1b849b'}
                }}
                disabled={!!scoreError}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEditClick}
              sx={{ 
                mr: 1,
                backgroundColor:  '#44a3b8',
                boxShadow: '0',
                '&:hover': {backgroundColor: '#1b849b'}
              }}
            >
              Edit
            </Button>
          )}
        </Box>}
      </CardContent>
    </Card>
  );
};

export default CommitChecks;





// import React from 'react';
// import { Card, CardContent, Typography, Divider, Box, List, ListItem, ListItemText } from '@mui/material';
// import { ReportDetails } from '../../interfaces/ReportDetails';
// interface Props {
//   report: ReportDetails
// }
// const CommitChecks: React.FC<Props> = ({report}) => {
//   const { strengths, weaknesses, areas_of_improvement } = report.step_report.report;
//   const { message, date } = report.step_report.final_commit_details ?? { message: "no message", date: "no date" };

//   return (
//     <Card sx={{ mx: 'auto', borderRadius: 2, p: 2 }}>
//       <CardContent>
//         {/* Header with Overall Score */}
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//           <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
//             Commit Report
//           </Typography>
//           <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#000' }}>
//             {report.step_report.overall_score}/10
//           </Typography>
//         </Box>
        
//         <Typography variant="h6" sx={{ color: '#444' }}>
//           Final Commit Details: 
//         </Typography>
//         <List dense>
//           <ListItem sx={{ pl: 0 }}>
//               <ListItemText primary={`Last Commit Time: ${(new Date(date)).toLocaleString()}`} sx={{ color: '#555' }} />
//           </ListItem>
//           <ListItem sx={{ pl: 0 }}>
//               <ListItemText primary={`Commit Message: ${message}`} sx={{ color: '#555' }} />
//           </ListItem>
//         </List>

//         <Divider sx={{ my: 2 }} />

//         {/* Strengths Section */}
//         <Typography variant="h6" sx={{ color: '#444', mb: 1 }}>
//           Strengths
//         </Typography>
//         <List dense>
//           {strengths.length > 0 ? (
//             strengths.map((strength, index) => (
//               <ListItem key={index} sx={{ pl: 0 }}>
//                 <ListItemText primary={`${index+1}. ${strength}`} sx={{ color: '#555' }} />
//               </ListItem>
//             ))
//           ) : (
//             <Typography sx={{ color: '#777' }}>No strengths identified.</Typography>
//           )}
//         </List>

//         <Divider sx={{ my: 2 }} />

//         {/* Weaknesses Section */}
//         <Typography variant="h6" sx={{ color: '#444', mb: 1 }}>
//           Weaknesses
//         </Typography>
//         <List dense>
//           {weaknesses.length > 0 ? (
//             weaknesses.map((weakness, index) => (
//               <ListItem key={index} sx={{ pl: 0 }}>
//                 <ListItemText primary={`${index+1}. ${weakness}`} sx={{ color: '#555' }} />
//               </ListItem>
//             ))
//           ) : (
//             <Typography sx={{ color: '#777' }}>No weaknesses identified.</Typography>
//           )}
//         </List>

//         <Divider sx={{ my: 2 }} />

//         {/* Areas of Improvement Section */}
//         <Typography variant="h6" sx={{ color: '#444', mb: 1 }}>
//           Areas of Improvement
//         </Typography>
//         <List dense>
//           {areas_of_improvement.length > 0 ? (
//             areas_of_improvement.map((area, index) => (
//               <ListItem key={index} sx={{ pl: 0 }}>
//                 <ListItemText primary={`${index+1}. ${area}`} sx={{ color: '#555' }} />
//               </ListItem>
//             ))
//           ) : (
//             <Typography sx={{ color: '#777' }}>No areas of improvement identified.</Typography>
//           )}
//         </List>
//       </CardContent>
//     </Card>
//   );
// };

// export default CommitChecks;