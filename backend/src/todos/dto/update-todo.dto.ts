import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed'])
  status?: 'pending' | 'in_progress' | 'completed';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsEnum(['work' , 'personal' , 'study'])
  category?:'work' | 'personal' | 'study';

  @IsOptional()
  @IsString()
  dueDate?: string;
}
