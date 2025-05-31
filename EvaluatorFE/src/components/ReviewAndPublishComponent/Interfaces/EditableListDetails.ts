export interface EditableListDetailsProps {
    title: string;
    items: string[];
    isEditing?: boolean;
    error: boolean;
    onAddItem: () => void;
    onRemoveItem: (index: number) => void;
    onChangeItem: (index: number, value: string) => void;
}