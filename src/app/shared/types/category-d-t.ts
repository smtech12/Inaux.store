export interface ICategoryType {
  id:number,
  img?:string,
  parentTitle:string,
  children?:string[],
  smDesc?:string,
  isDark?:boolean, // For brightness detection (dark image = true, light image = false)
}
