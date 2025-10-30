export enum Tool {
  Minifier = 'MINIFIER',
  IconGenerator = 'ICON_GENERATOR',
  Cheatsheet = 'CHEATSHEET',
  RegexGenerator = 'REGEX_GENERATOR',
  JsonToType = 'JSON_TO_TYPE',
  CodeRefactor = 'CODE_REFACTOR',
  WebsiteAnalyzer = 'WEBSITE_ANALYZER',
}

export enum FileStatus {
  Idle = 'IDLE',
  Processing = 'PROCESSING',
  Success = 'SUCCESS',
  Error = 'ERROR',
}

export interface ProcessedCodeFile {
  id: string;
  file: File;
  language: 'JavaScript' | 'CSS' | 'HTML' | null;
  status: FileStatus;
  minifiedContent?: string;
  error?: string;
}

export interface GeneratedIcon {
  size: number;
  blob: Blob;
  dataUrl: string;
}