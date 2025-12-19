$excel = New-Object -ComObject Excel.Application
$workbook = $excel.Workbooks.Open('d:\MyApps\ForAlisara\AliManager\cardcolors.xlsx')
$sheet = $workbook.Sheets.Item(1)
$range = $sheet.UsedRange
$rows = $range.Rows.Count
$cols = $range.Columns.Count
for ($r = 1; $r -le $rows; $r++) {
    $line = ""
    for ($c = 1; $c -le $cols; $c++) {
        $line += $sheet.Cells.Item($r, $c).Text + "`t"
    }
    Write-Output $line
}
$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
