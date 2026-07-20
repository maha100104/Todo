import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateTodoDto {
  @IsNotEmpty()
  @IsString()
  title: string;

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
  @IsEnum(['personal', 'work' , 'study'])
  category?:'personal' | 'work' | 'study';

  @IsOptional()
  @IsString()
  dueDate?: string;
}
