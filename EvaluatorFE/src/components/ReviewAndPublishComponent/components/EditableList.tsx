import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, IconButton, List, ListItem, ListItemText, TextField, Typography } from '@mui/material';
import React from 'react';
import { EditableListDetailsProps } from '../Interfaces/EditableListDetails';


const EditableList: React.FC<EditableListDetailsProps> = ({ title, items, isEditing, onAddItem, onRemoveItem, onChangeItem }) => {
  return (
    <>
      <Typography variant="h6" sx={{ color: '#444', mb: 1 }}>
        {title}
      </Typography>
      <List dense>
        {isEditing ? (
          items.map((item, index) => (
            <ListItem key={index} sx={{ pl: 0 }}>
              <TextField
                fullWidth
                value={item}
                onChange={(e) => onChangeItem(index, e.target.value)}
                sx={{ mr: 1 }}
              />
              <IconButton onClick={() => onRemoveItem(index)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))
        ) : (
          items.length > 0 ? (
            items.map((item, index) => (
              <ListItem key={index} sx={{ pl: 0 }}>
                <ListItemText primary={`${index + 1}. ${item}`} sx={{ color: '#555' }} />
              </ListItem>
            ))
          ) : (
            <Typography sx={{ color: '#777' }}>No {title.toLowerCase()} identified.</Typography>
          )
        )}
        {isEditing && (
          <ListItem>
            <Button startIcon={<AddIcon />} onClick={onAddItem}>
              Add {title}
            </Button>
          </ListItem>
        )}
      </List>
    </>
  );
};

export default EditableList;
