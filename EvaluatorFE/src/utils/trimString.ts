export default function(text:string,maxChars:number){
    return text.length > maxChars ? text.substring(0,maxChars) + " ..." : text
}