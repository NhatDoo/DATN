import { Controller, Post, Body, Get, Patch, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Post()
    create(@Body() createReportDto: CreateReportDto) {
        return this.reportsService.create(createReportDto);
    }

    @Get()
    findAll() {
        return this.reportsService.findAll();
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.reportsService.updateStatus(id, status);
    }

    @Get('instructor/:instructorId')
    findByInstructor(@Param('instructorId') instructorId: string) {
        return this.reportsService.findByInstructor(instructorId);
    }
}
