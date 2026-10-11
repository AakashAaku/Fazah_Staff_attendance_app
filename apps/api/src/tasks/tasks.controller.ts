import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskStatusDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Req() req: any, @Body() createTaskDto: CreateTaskDto) {
    const tenantId = req.user.tenantId || '11111111-1111-1111-1111-111111111111';
    const userId = req.user.sub;
    return this.tasksService.create(tenantId, userId, createTaskDto);
  }

  @Get()
  findAll(@Req() req: any, @Query('branchId') branchId?: string, @Query('employeeId') employeeId?: string) {
    const tenantId = req.user.tenantId || '11111111-1111-1111-1111-111111111111';
    return this.tasksService.findAll(tenantId, branchId, employeeId);
  }

  @Patch(':id/status')
  updateStatus(@Req() req: any, @Param('id') id: string, @Body() updateTaskStatusDto: UpdateTaskStatusDto) {
    const tenantId = req.user.tenantId || '11111111-1111-1111-1111-111111111111';
    return this.tasksService.updateStatus(tenantId, id, updateTaskStatusDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId || '11111111-1111-1111-1111-111111111111';
    return this.tasksService.remove(tenantId, id);
  }
}
