import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axiosInstance from '../../services/axiosconfig';
import { API_URL } from '@env';
import { AppContext } from '../../contexts/AppContext';

const ServerSideTable = ({
  url,
  actionFunctions = {},
  extraParams = {},
  canSanction = false,
  canHavePool = false,
  pendingApplications = false,
  serviceId,
  refreshTrigger,
  onPushToPool,
  onExecuteAction,
  actionOptions = [],
  selectedAction,
  setSelectedAction,
}) => {
  const { theme } = useContext(AppContext);
  const [columns, setColumns] = useState([]);
  const [inboxData, setInboxData] = useState([]);
  const [poolData, setPoolData] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [viewType, setViewType] = useState('Inbox');
  const [hasActions, setHasActions] = useState(false);

  const pageSizeOptions = [10, 25, 50];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(API_URL + url, {
        params: {
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          ...extraParams,
        },
      });
      const json = response.data;
      console.log('API Response:', json);
      console.log('Columns:', json.columns);
      console.log('Inbox Data:', json.data);
      console.log(
        'Inbox Data Items:',
        json.data.map(item => ({ sno: item.sno })),
      );
      console.log('Pool Data:', json.poolData);
      console.log('Total Records:', json.totalRecords);

      const hasAnyActions =
        json.data?.some(row => row.customActions?.length > 0) ||
        json.poolData?.some(row => row.customActions?.length > 0) ||
        false;

      // Map columns if needed (e.g., 'name' to 'applicantName')
      const mappedColumns = json.columns.map(col => ({
        ...col,
        accessorKey:
          col.accessorKey === 'name' ? 'applicantName' : col.accessorKey,
      }));

      setHasActions(hasAnyActions);
      setColumns(mappedColumns || []);
      setInboxData(json.data || []);
      setPoolData(json.poolData || []);
      setTotalRecords(json.totalRecords || 0);
      setPageCount(Math.ceil((json.totalRecords || 0) / pagination.pageSize));
    } catch (error) {
      console.error('Error fetching data:', {
        message: error.message,
        url: API_URL + url,
        params: {
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          ...extraParams,
        },
        responseData: error.response?.data,
        status: error.response?.status,
        fullError: error,
      });
    } finally {
      setIsLoading(false);
      console.log('Loading Complete, isLoading:', false);
    }
  }, [
    url,
    pagination.pageIndex,
    pagination.pageSize,
    extraParams,
    refreshTrigger,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isPoolView = viewType === 'Pool';
  const tableData = isPoolView ? poolData : inboxData;
  const showToggleButtons = poolData && poolData.length > 0;

  const handleViewTypeChange = value => {
    if (value) {
      setViewType(value);
      setRowSelection({});
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }
  };

  const toggleRowSelection = rowId => {
    setRowSelection(prev => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const handlePageChange = pageIndex => {
    setPagination(prev => ({ ...prev, pageIndex }));
  };

  const handlePageSizeChange = pageSize => {
    setPagination({ pageIndex: 0, pageSize });
  };

  console.log('Rendering Table:', {
    tableData,
    tableDataLength: tableData.length,
    viewType,
    columns: columns.map(col => col.accessorKey),
    itemKeys: tableData[0] ? Object.keys(tableData[0]) : [],
    hasActions,
    canSanction,
    pendingApplications,
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    pageCount,
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
          <Text style={styles.buttonText}>⟳ Refresh</Text>
        </TouchableOpacity>

        {showToggleButtons && (
          <View style={styles.toggleGroup}>
            {['Inbox', 'Pool'].map(view => (
              <TouchableOpacity
                key={view}
                onPress={() => handleViewTypeChange(view)}
                style={[
                  styles.toggleButton,
                  viewType === view && [
                    styles.toggleButtonActive,
                    { backgroundColor: theme.main },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    viewType === view && styles.toggleButtonTextActive,
                  ]}
                >
                  {view}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {canSanction && pendingApplications && viewType === 'Inbox' && (
        <TouchableOpacity
          disabled={Object.keys(rowSelection).length === 0}
          onPress={() => onPushToPool(Object.keys(rowSelection))}
          style={[
            styles.actionButton,
            styles.pushToPoolButton,
            { backgroundColor: theme.main },
            Object.keys(rowSelection).length === 0 && styles.disabledButton,
          ]}
        >
          <Text style={styles.actionText}>Push to Pool</Text>
        </TouchableOpacity>
      )}

      {canHavePool && viewType === 'Pool' && (
        <View style={styles.bulkAction}>
          <Picker
            selectedValue={selectedAction}
            onValueChange={setSelectedAction}
            style={styles.picker}
          >
            {actionOptions.map(option => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
          <TouchableOpacity
            disabled={Object.keys(rowSelection).length === 0}
            onPress={() => onExecuteAction(Object.keys(rowSelection))}
            style={[
              styles.actionButton,
              { backgroundColor: theme.main },
              Object.keys(rowSelection).length === 0 && styles.disabledButton,
            ]}
          >
            <Text style={styles.actionText}>Execute</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={theme.main}
          style={styles.loader}
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled={true}
        >
          <ScrollView horizontal style={styles.horizontalScroll}>
            <View style={styles.tableContainer}>
              {tableData.length > 0 ? (
                <>
                  {/* Header Row */}
                  <View
                    style={[
                      styles.row,
                      styles.headerRow,
                      { backgroundColor: theme.main },
                    ]}
                  >
                    {canSanction && pendingApplications && (
                      <Text
                        style={[
                          styles.cell,
                          styles.headerCell,
                          styles.checkboxCell,
                        ]}
                      >
                        Select
                      </Text>
                    )}
                    {columns.map(col => (
                      <Text
                        key={col.accessorKey}
                        style={[styles.cell, styles.headerCell]}
                      >
                        {col.header || col.accessorKey}
                      </Text>
                    ))}
                    {hasActions && (
                      <Text
                        style={[
                          styles.cell,
                          styles.headerCell,
                          styles.actionsCell,
                        ]}
                      >
                        Actions
                      </Text>
                    )}
                  </View>
                  {/* Data Rows */}
                  {tableData.map((item, index) => (
                    <View
                      key={item.sno?.toString() || Math.random().toString()}
                      style={[
                        styles.row,
                        index % 2 === 0 ? styles.rowEven : styles.rowOdd,
                      ]}
                    >
                      {canSanction && pendingApplications && (
                        <TouchableOpacity
                          onPress={() => toggleRowSelection(item.sno)}
                          style={[styles.checkbox, styles.checkboxCell]}
                        >
                          <Text style={styles.checkboxText}>
                            {rowSelection[item.sno] ? '☑' : '☐'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {columns.map(col => (
                        <Text key={col.accessorKey} style={[styles.cell]}>
                          {item[col.accessorKey] ?? '-'}
                        </Text>
                      ))}
                      {hasActions && (
                        <View style={[styles.actions, styles.actionsCell]}>
                          {item.customActions?.map((action, idx) => (
                            <TouchableOpacity
                              key={idx}
                              onPress={() =>
                                actionFunctions[action.actionFunction]?.(item)
                              }
                              style={[
                                styles.actionButton,
                                { backgroundColor: theme.main },
                              ]}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.actionText}>
                                {action.name || action.tooltip}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.emptyText}>
                  No {viewType.toLowerCase()} applications available.
                </Text>
              )}
            </View>
          </ScrollView>
          {tableData.length > 0 && (
            <View style={styles.paginationContainer}>
              <View style={styles.pageSizeSelector}>
                <Text style={styles.paginationText}>Rows per page:</Text>
                <Picker
                  selectedValue={pagination.pageSize}
                  onValueChange={handlePageSizeChange}
                  style={styles.pageSizePicker}
                >
                  {pageSizeOptions.map(size => (
                    <Picker.Item
                      key={size}
                      label={size.toString()}
                      value={size}
                    />
                  ))}
                </Picker>
              </View>
              <View style={styles.pageNavigation}>
                <TouchableOpacity
                  disabled={pagination.pageIndex === 0}
                  onPress={() => handlePageChange(pagination.pageIndex - 1)}
                  style={[
                    styles.pageButton,
                    pagination.pageIndex === 0 && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.buttonText}>Previous</Text>
                </TouchableOpacity>
                {[...Array(pageCount).keys()].map(page => (
                  <TouchableOpacity
                    key={page}
                    onPress={() => handlePageChange(page)}
                    style={[
                      styles.pageButton,
                      pagination.pageIndex === page && [
                        styles.pageButtonActive,
                        { backgroundColor: theme.main },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        pagination.pageIndex === page &&
                          styles.pageButtonTextActive,
                      ]}
                    >
                      {page + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  disabled={pagination.pageIndex >= pageCount - 1}
                  onPress={() => handlePageChange(pagination.pageIndex + 1)}
                  style={[
                    styles.pageButton,
                    pagination.pageIndex >= pageCount - 1 &&
                      styles.disabledButton,
                  ]}
                >
                  <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.paginationText}>
                Page {pagination.pageIndex + 1} of {pageCount}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
    minHeight: 400,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  horizontalScroll: {
    flex: 1,
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'red', // Debug border, change to '#e5e7eb' after testing
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  toggleButtonActive: {
    backgroundColor: '#1e40af',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerCell: {
    flex: 1,
    minWidth: 100,
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  rowEven: {
    backgroundColor: '#ffffff',
  },
  rowOdd: {
    backgroundColor: '#f9fafb',
  },
  checkbox: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCell: {
    width: 40,
    minWidth: 40,
  },
  checkboxText: {
    fontSize: 18,
    color: '#1f2937',
  },
  cell: {
    flex: 1,
    minWidth: 100,
    fontSize: 14,
    color: '#1f2937',
    paddingHorizontal: 8,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsCell: {
    width: 100,
    minWidth: 100,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pushToPoolButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  bulkAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  picker: {
    flex: 1,
    height: 40,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  pageSizeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  pageSizePicker: {
    width: 80,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    marginLeft: 8,
  },
  pageNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    marginHorizontal: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pageButtonActive: {
    backgroundColor: '#1e40af',
  },
  pageButtonTextActive: {
    color: '#ffffff',
  },
  paginationText: {
    fontSize: 14,
    color: '#1f2937',
    marginHorizontal: 8,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  footerText: {
    textAlign: 'center',
    padding: 12,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  loader: {
    marginVertical: 20,
  },
});

export default ServerSideTable;
