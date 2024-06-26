import { type Ref, reactive, ref, onMounted, h, toRaw, watch } from "vue";
import editForm from "../form.vue";
import { message } from "@/utils/message";
import type { FormItemProps } from "./types";
import { getKeyList, deviceDetection } from "@pureadmin/utils";
import { addDialog } from "@/components/ReDialog";
import type { PaginationProps } from "@pureadmin/table";
import { getDefinitionList, createDefinition, updateDefinition} from "@/api/flowable/definition"


export function useDefinition() {
  const form = reactive({
    name: "",
  });
  const curRow = ref();
  const formRef = ref();
  const dataList = ref([]);
  const loading = ref(true);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    {
      label: "流程编号",
      prop: "id"
    },
    {
      label: "流程标识",
      prop: "key"
    },
    {
      label: "流程分类",
      prop: "category"
    },
    {
      label: "流程名称",
      prop: "name"
    },
    {
      label: "流程版本",
      prop: "version"
    },
    {
      label: "状态",
      prop: "status"
    },
    {
      label: "操作",
      fixed: "right",
      width: 210,
      slot: "operation"
    }
  ]

  async function onSearch() {
    loading.value = true;
    const { data } = await getDefinitionList(toRaw(form));
    dataList.value = data.records;
    pagination.total = data.total;
    pagination.pageSize = data.pageSize;
    pagination.currentPage = data.currentPage;

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  /** 高亮当前权限选中行 */
  function rowStyle({ row: { id } }) {
    return {
      cursor: "pointer",
      background: id === curRow.value?.id ? "var(--el-fill-color-light)" : ""
    };
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}流程`,
      props: {
        formInline: {
          xml: row?.xml ?? "",
        }
      },
      width: "80%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        function chores() {
          message(`您${title}了角色名称为的这条数据`, {
            type: "success"
          });
          done(); // 关闭弹框
          onSearch(); // 刷新表格数据
        }
        FormRef.validate(valid => {
          if (valid) {
            console.log("curData", curData);
            // 表单规则校验通过
            if (title === "新增") {
              createDefinition(curData).then(()=>{
                // 实际开发先调用新增接口，再进行下面操作
                chores();
              })

            } else {
              updateDefinition(row.id,curData).then(()=>{
                // 实际开发先调用修改接口，再进行下面操作
                chores();
              })

            }
          }
        });
      }
    });
  }

  function handleDelete(row) {
    message(`您删除了角色名称为${row.name}的这条数据`, { type: "success" });
    onSearch();
  }

  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
  }

  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
  }

  function handleSelectionChange(val) {
    console.log("handleSelectionChange", val);
  }

  onMounted(()=>{
    onSearch();
  })

  return {
    form,
    formRef,
    loading,
    columns,
    dataList,
    pagination,
    onSearch,
    rowStyle,
    resetForm,
    openDialog,
    handleDelete,
    handleSizeChange,
    handleCurrentChange,
    handleSelectionChange
  }
}
