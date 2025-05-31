import { TextField } from '@mui/material';
import React from 'react';

interface Props {
    editedScore: number,
    handleScoreChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    scoreError: string
}

export const ScoreComponent: React.FC<Props> = ({editedScore, handleScoreChange, scoreError}) => {
    const numberInputOnWheelPreventChange = (e: React.WheelEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement;
        target.blur();
        e.stopPropagation();
        setTimeout(() => {
          target.focus();
        }, 0);
    };
    return (
        <TextField
            type="number"
            value={editedScore}
            onChange={handleScoreChange}
            onWheel={numberInputOnWheelPreventChange}
            sx={{ 
            width: 80, 
            '& input[type=number]': {
                MozAppearance: 'textfield',
            },
            '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
            },
            }}
            error={!!scoreError}
            InputProps={{
            sx: {
                height: '2.5rem', // Adjust the height to match the Typography
                fontSize: '1.2rem', // Adjust the font size to match the Typography
                fontWeight: '900',
            },
            }}
        />
    );
}