import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Divider, Button, FormHelperText } from '@mui/material';
import { ReportDetails, StepReportDetails } from '../../interfaces/ReportDetails';
import EditableList from './components/EditableList';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import { ScoreComponent } from './components/ScoreComponent';

interface Props {
  report: ReportDetails;
  updateHandler?: (stepName: string, updateDetails: StepReportDetails) => Promise<void>;
}

const CodeQuality: React.FC<Props> = ({ report, updateHandler }) => {
  const { strengths, weaknesses, areas_of_improvement } = report.step_report.report;
  const [isEditing, setIsEditing] = useState(false);
  const [editedStrengths, setEditedStrengths] = useState<string[]>(strengths);
  const [editedWeaknesses, setEditedWeaknesses] = useState<string[]>(weaknesses);
  const [editedAreasOfImprovement, setEditedAreasOfImprovement] = useState<string[]>(areas_of_improvement);
  const [editedScore, setEditedScore] = useState<number>(report.step_report.overall_score);
  const [scoreError, setScoreError] = useState<string>('');

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState({
    strengths: false,
    weaknesses: false,
    areasOfImprovement: false,
  });

  // Original states to revert changes on cancel
  const [originalStrengths, setOriginalStrengths] = useState<string[]>(strengths);
  const [originalWeaknesses, setOriginalWeaknesses] = useState<string[]>(weaknesses);
  const [originalAreasOfImprovement, setOriginalAreasOfImprovement] = useState<string[]>(areas_of_improvement);
  const [originalScore, setOriginalScore] = useState<number>(report.step_report.overall_score);

  const handleEditClick = () => {
    setIsEditing(true);
    setOriginalStrengths(editedStrengths);
    setOriginalWeaknesses(editedWeaknesses);
    setOriginalAreasOfImprovement(editedAreasOfImprovement);
    setOriginalScore(editedScore);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedStrengths(originalStrengths);
    setEditedWeaknesses(originalWeaknesses);
    setEditedAreasOfImprovement(originalAreasOfImprovement);
    setEditedScore(originalScore);
    setFieldErrors({ strengths: false, weaknesses: false, areasOfImprovement: false });
  };

  const handleAddItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, '']);
  };

  const handleRemoveItem = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeItem = (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value > 10) {
      setScoreError('Score cannot be more than 10');
    } else if (value < 0) {
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

  const handleSave = () => {
    if (!validateFields()) {
      return; // Do not proceed if validation fails
    }

    setIsEditing(false);
    const updatedDetails: StepReportDetails = {
      overall_score: editedScore,
      report: {
        strengths: editedStrengths,
        weaknesses: editedWeaknesses,
        areas_of_improvement: editedAreasOfImprovement,
      },
      userevaluation_id: report.step_report.userevaluation_id,
      final_commit_details: report.step_report.final_commit_details,
    };

    if(updateHandler)
    updateHandler('code_quality_report', updatedDetails)
      .then((res) => console.log(res))
      .catch((err) => console.error(err));
  };

  return (
    <Card sx={{ mx: 'auto', borderRadius: 2, p: 2 }}>
      <CardContent>
        {/* Header with Overall Score */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, height: '2rem' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
            Code Quality
          </Typography>
          {isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <ScoreComponent
                editedScore={editedScore}
                handleScoreChange={handleScoreChange}
                scoreError={scoreError}
              />
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

        {/* Buttons */}
        {updateHandler && <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          {isEditing ? (
            <>
              <Button
                variant="contained"
                startIcon={<CancelIcon />}
                onClick={handleCancelClick}
                sx={{
                  boxShadow: '0',
                  backgroundColor: '#e60202',
                  '&:hover': { backgroundColor: '#cc0000' },
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
                  '&:hover': { backgroundColor: '#1b849b' },
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
                boxShadow: '0',
                backgroundColor: '#44a3b8',
                '&:hover': { backgroundColor: '#1b849b' },
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

export default CodeQuality;

// import React, { useState } from 'react';
// import { Card, CardContent, Typography, Box, Divider, Button, TextField, FormHelperText } from '@mui/material';
// import { ReportDetails } from '../../interfaces/ReportDetails';
// import EditableList from './components/EditableList';
// import CancelIcon from '@mui/icons-material/Cancel';
// import EditIcon from '@mui/icons-material/Edit';

// interface Props {
//   report: ReportDetails;
// }

// const CodeQuality: React.FC<Props> = ({ report }) => {
//   const { strengths, weaknesses, areas_of_improvement } = report.step_report.report;
//   const [isEditing, setIsEditing] = useState(false);
//   const [editedStrengths, setEditedStrengths] = useState<string[]>(strengths);
//   const [editedWeaknesses, setEditedWeaknesses] = useState<string[]>(weaknesses);
//   const [editedAreasOfImprovement, setEditedAreasOfImprovement] = useState<string[]>(areas_of_improvement);
//   const [editedScore, setEditedScore] = useState<number>(report.step_report.overall_score);
//   const [scoreError, setScoreError] = useState<string>('');

//   const handleEditClick = () => {
//     setIsEditing(true);
//   };

//   const handleCancelClick = () => {
//     setIsEditing(false);
//   };

//   const handleAddItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
//     setter(prev => [...prev, '']);
//   };

//   const handleRemoveItem = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
//     setter(prev => prev.filter((_, i) => i !== index));
//   };

//   const handleChangeItem = (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
//     setter(prev => prev.map((item, i) => (i === index ? value : item)));
//   };

//   const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = Number(e.target.value);
//     if (value > 10) {
//       setScoreError('Score cannot be more than 10');
//     } else {
//       setScoreError('');
//     }
//     setEditedScore(value);
//   };

//   const handleSave = () => {
//     // Handle submit logic here
//     console.log('Submitted:', { editedStrengths, editedWeaknesses, editedAreasOfImprovement, editedScore });
//   };

//   return (
//     <Card sx={{ mx: 'auto', borderRadius: 2, p: 2 }}>
//       <CardContent>
//         {/* Header with Overall Score */}
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, height: '2rem' }}>
//           <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
//             Code Quality
//           </Typography>
//           {isEditing ? (
//             <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
//               <TextField
//                 type="number"
//                 value={editedScore}
//                 onChange={handleScoreChange}
//                 sx={{ width: 80,
//                   '& input[type=number]': {
//                     MozAppearance: 'textfield',
//                   },
//                   '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
//                     WebkitAppearance: 'none',
//                     margin: 0,
//                   },
//                 }}
//                 error={!!scoreError}
//                 InputProps={{
//                   sx: {
//                     height: '2.5rem', // Adjust the height to match the Typography
//                     fontSize: '1.2rem', // Adjust the font size to match the Typography
//                     fontWeight: '900',
//                   },
//                 }}
//               />
//               {scoreError && (
//                 <FormHelperText error sx={{ fontSize: '0.875rem' }}>
//                   {scoreError}
//                 </FormHelperText>
//               )}
//             </Box>
//           ) : (
//             <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#000' }}>
//               {report.step_report.overall_score}/10
//             </Typography>
//           )}
//         </Box>

//         {/* Buttons */}
//         <Box sx={{ 
//           display: 'flex', 
//           justifyContent: 'flex-start', 
//           mb: 2,
          
//           }}>
//             {isEditing ? (
//             <Button
//               variant="contained"
//               // color="error"
//               startIcon={<CancelIcon />}
//               onClick={handleCancelClick}
//               sx={{
//                 boxShadow: '0',
//                 backgroundColor: '#e60202', // Default lighter red
//                 '&:hover': {
//                   backgroundColor: '#cc0000',} // Deeper red on hover
//               }}
//             >
//               Cancel
//             </Button>
//           ) : (
//             <Button
//               variant="contained"
//               color="primary"
//               startIcon={<EditIcon />}
//               onClick={handleEditClick}
//               sx={{
//                 backgroundColor:  '#44a3b8',
//                 boxShadow: '0',
//                 '&:hover': {backgroundColor: '#1b849b'}
//               }}
//             >
//               Edit
//             </Button>
//           )}
//         </Box>

//         {/* Strengths Section */}
//         <EditableList
//           title="Strengths"
//           items={editedStrengths}
//           isEditing={isEditing}
//           onAddItem={() => handleAddItem(setEditedStrengths)}
//           onRemoveItem={(index) => handleRemoveItem(index, setEditedStrengths)}
//           onChangeItem={(index, value) => handleChangeItem(index, value, setEditedStrengths)}
//         />

//         <Divider sx={{ my: 2 }} />

//         {/* Weaknesses Section */}
//         <EditableList
//           title="Weaknesses"
//           items={editedWeaknesses}
//           isEditing={isEditing}
//           onAddItem={() => handleAddItem(setEditedWeaknesses)}
//           onRemoveItem={(index) => handleRemoveItem(index, setEditedWeaknesses)}
//           onChangeItem={(index, value) => handleChangeItem(index, value, setEditedWeaknesses)}
//         />

//         <Divider sx={{ my: 2 }} />

//         {/* Areas of Improvement Section */}
//         <EditableList
//           title="Areas of Improvement"
//           items={editedAreasOfImprovement}
//           isEditing={isEditing}
//           onAddItem={() => handleAddItem(setEditedAreasOfImprovement)}
//           onRemoveItem={(index) => handleRemoveItem(index, setEditedAreasOfImprovement)}
//           onChangeItem={(index, value) => handleChangeItem(index, value, setEditedAreasOfImprovement)}
//         />

//         {isEditing && (
//           <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
//             <Button
//               variant="contained"
//               color="primary"
//               onClick={handleSave}
//               sx={{ mr: 1,
//                 boxShadow: '0',
//                 backgroundColor: '#44a3b8',
//                 '&:hover': {backgroundColor: '#1b849b'}
//               }}
//               disabled={!!scoreError}
//             >
//               Save
//             </Button>
//           </Box>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// export default CodeQuality;