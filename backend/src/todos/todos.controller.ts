import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { JwtAuthGuard } from '../guard/jwt-auth-guard';
import { GetUser } from '../customDecorator/getProfile';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  create(@GetUser() user: any, @Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(user.id, createTodoDto);
  }

  @Get()
  findAll(
    @GetUser() user: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('category') category?:string,
  ) {
    return this.todosService.findAll(user.id, status, priority, search, category);
  }

  @Get(':id')
  findOne(@GetUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.todosService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @GetUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return this.todosService.update(user.id, id, updateTodoDto);
  }

  @Patch(':id/toggle')
  toggleStatus(@GetUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.todosService.toggleStatus(user.id, id);
  }

  @Delete(':id')
  remove(@GetUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.todosService.remove(user.id, id);
  }
}
