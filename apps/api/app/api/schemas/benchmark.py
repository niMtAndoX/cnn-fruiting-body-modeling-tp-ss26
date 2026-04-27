from pydantic import BaseModel


class BenchmarkReceivedFilesResponse(BaseModel):
    
    test_archive: str
    label_archive: str
    
class BenchmarkDummyResponse(BaseModel):
    
    status: str
    message: str
    received_files: BenchmarkReceivedFilesResponse