export interface Resume {
  id: number | string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  extracted_text?: string;
  parsed_data?: Record<string, any>;
  ai_analysis?: Record<string, any>;
  analysis_status?: 'pending' | 'processing' | 'completed' | 'failed';
  uploaded_at: string;
  updated_at: string;
}
