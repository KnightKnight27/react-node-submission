import {
    Button,
    Flex,
    FormLabel,
    Grid,
    GridItem,
    IconButton,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Radio,
    RadioGroup,
    Stack,
    Text,
    Textarea
} from '@chakra-ui/react';
import {CUIAutoComplete} from 'chakra-ui-autocomplete';
import MultiContactModel from 'components/commonTableModel/MultiContactModel';
import MultiLeadModel from 'components/commonTableModel/MultiLeadModel';
import Spinner from 'components/spinner/Spinner';
import dayjs from 'dayjs';
import {useFormik} from 'formik';
import {useEffect, useState} from 'react';
import {LiaMousePointerSolid} from 'react-icons/lia';
import {useSelector} from 'react-redux';
import {toast} from 'react-toastify';
import {MeetingSchema} from 'schema';
import {postApi} from 'services/api';

const AddMeeting = (props) => {
    const {onClose, isOpen, setAction, from, fetchData, view} = props
    const [isLoding, setIsLoding] = useState(false)
    const [contactModelOpen, setContactModel] = useState(false);
    const [leadModelOpen, setLeadModel] = useState(false);
    const todayTime = new Date().toISOString().split('.')[0];
    const leadData = useSelector((state) => state?.leadData?.data);


    const user = JSON.parse(localStorage.getItem('user'))

    const contactData = useSelector((state) => state?.contactData?.data)


    const initialValues = {
        agenda: '',
        attendees: props.leadContect === 'contactView' && props.id ? [props.id] : [],
        attendeesLead: props.leadContect === 'leadView' && props.id ? [props.id] : [],
        location: '',
        related: props.leadContect === 'contactView' ? 'Contact' : props.leadContect === 'leadView' ? 'Lead' : 'None',
        dateTime: '',
        notes: '',
        createBy: user?._id,
    }

    const formik = useFormik({
        initialValues: initialValues, validationSchema: MeetingSchema, onSubmit: (values, {resetForm}) => {
            addMeetingData(values)
        },
    });
    const {errors, touched, values, handleBlur, handleChange, handleSubmit, setFieldValue} = formik

    const addMeetingData = async (values) => {
        try {
            setIsLoding(true)
            let response = await postApi('api/meeting/add', values)
            if (response.status === 200) {
                onClose();
                toast.success(`Meeting Saved successfully`)
                formik.resetForm();
                setAction((pre) => !pre)
            }
        } catch (e) {
            console.log(e);
            toast.error(`server error`)
        } finally {
            setIsLoding(false)
        }
    };

    useEffect(() => {
    }, [props.id, values.related])

    const extractLabels = (selectedItems) => {
        return selectedItems.map((item) => item._id);
    };

    const countriesWithEmailAsLabel = Array.isArray(values.related === "Contact" ? contactData : leadData) ? (values.related === "Contact" ? contactData : leadData).map((item) => ({
        ...item,
        value: item._id,
        label: values.related === "Contact" ? item.fullName : item.leadName })) : [];


    return (<Modal onClose={onClose} isOpen={isOpen} isCentered>
            <ModalOverlay/>
            <ModalContent height={"580px"}>
                <ModalHeader>Add Meeting </ModalHeader>
                <ModalCloseButton/>
                <ModalBody overflowY={"auto"} height={"400px"}>
                    {/* Contact Model  */}
                    <MultiContactModel data={contactData} isOpen={contactModelOpen} onClose={setContactModel}
                                       fieldName='attendees' setFieldValue={setFieldValue}/>
                    {/* Lead Model  */}
                    <MultiLeadModel data={leadData} isOpen={leadModelOpen} onClose={setLeadModel}
                                    fieldName='attendeesLead' setFieldValue={setFieldValue}/>

                    <Grid templateColumns="repeat(12, 1fr)" gap={3}>
                        <GridItem colSpan={{base: 12}}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Agenda<Text color={"red"}>*</Text>
                            </FormLabel>
                            <Input
                                fontSize='sm'
                                onChange={handleChange} onBlur={handleBlur}
                                value={values.agenda}
                                name="agenda"
                                placeholder='Agenda'
                                fontWeight='500'
                                borderColor={errors.agenda && touched.agenda ? "red.300" : null}
                            />
                            <Text fontSize='sm' mb='10px'
                                  color={'red'}> {errors.agenda && touched.agenda && errors.agenda}</Text>
                        </GridItem>
                        <GridItem colSpan={{base: 12}}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Related To<Text color={"red"}>*</Text>
                            </FormLabel>
                            <RadioGroup onChange={(e) => setFieldValue('related', e)} value={values.related}>
                                <Stack direction='row'>
                                    {props.leadContect === 'contactView' && <Radio value='Contact'>Contact</Radio>}
                                    {props.leadContect === 'leadView' && <Radio value='Lead'>Lead</Radio>}
                                    {!props.leadContect && <> <Radio value='Contact'>Contact</Radio><Radio
                                        value='Lead'>Lead</Radio></>}
                                </Stack>
                            </RadioGroup>
                            <Text mb='10px' color={'red'}
                                  fontSize='sm'> {errors.related && touched.related && errors.related}</Text>
                        </GridItem>
                        {(values.related === "Contact" ? (contactData?.length ?? 0) > 0 : (leadData?.length ?? 0) > 0) && values.related &&

                            <GridItem colSpan={{base: 12}}>
                                <Flex alignItems={'end'} justifyContent={'space-between'}>
                                    <Text w={'100%'}>
                                        <CUIAutoComplete
                                            label={`Choose Preferred Attendees ${values.related === "Contact" ? "Contact" : values.related === "Lead" ? "Lead" : ""}`}
                                            placeholder="Type a Name"
                                            name="attendees"
                                            items={countriesWithEmailAsLabel}
                                            className='custom-autoComplete'
                                            selectedItems={countriesWithEmailAsLabel?.filter((item) => values.related === "Contact" ? values?.attendees.includes(item._id) : values.related === "Lead" && values?.attendeesLead.includes(item._id))}
                                            onSelectedItemsChange={(changes) => {
                                                const selectedLabels = extractLabels(changes.selectedItems);
                                                values.related === "Contact" ? setFieldValue('attendees', selectedLabels) : values.related === "Lead" && setFieldValue('attendeesLead', selectedLabels)
                                            }}
                                        />
                                    </Text>
                                    <IconButton mb={6}
                                                onClick={() => values.related === "Contact" ? setContactModel(true) : values.related === "Lead" && setLeadModel(true)}
                                                fontSize='25px' icon={<LiaMousePointerSolid/>}/>
                                </Flex>
                                <Text color={'red'}> {errors.attendees && touched.attendees && errors.attendees}</Text>
                            </GridItem>}
                        <GridItem colSpan={{base: 12}}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Location
                            </FormLabel>
                            <Input
                                fontSize='sm'
                                onChange={handleChange} onBlur={handleBlur}
                                value={values.location}
                                name="location"
                                placeholder='Location'
                                fontWeight='500'
                                borderColor={errors.location && touched.location ? "red.300" : null}
                            />
                            <Text mb='10px' color={'red'}
                                  fontSize='sm'> {errors.location && touched.location && errors.location}</Text>
                        </GridItem>
                        <GridItem colSpan={{base: 12}}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Date Time<Text color={"red"}>*</Text>
                            </FormLabel>
                            <Input
                                fontSize='sm'
                                type='datetime-local'
                                onChange={handleChange} onBlur={handleBlur}
                                min={dayjs(todayTime).format('YYYY-MM-DD HH:mm')}
                                value={values.dateTime}
                                name="dateTime"
                                placeholder='Date Time'
                                fontWeight='500'
                                borderColor={errors.dateTime && touched.dateTime ? "red.300" : null}
                            />
                            <Text fontSize='sm' mb='10px'
                                  color={'red'}> {errors.dateTime && touched.dateTime && errors.dateTime}</Text>
                        </GridItem>
                        <GridItem colSpan={{base: 12}}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Notes
                            </FormLabel>
                            <Textarea
                                resize={'none'}
                                fontSize='sm'
                                placeholder='Notes'
                                onChange={handleChange} onBlur={handleBlur}
                                value={values.notes}
                                name="notes"
                                fontWeight='500'
                                borderColor={errors.notes && touched.notes ? "red.300" : null}
                            />
                            <Text mb='10px' color={'red'}> {errors.notes && touched.notes && errors.notes}</Text>
                        </GridItem>

                    </Grid>


                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant='brand' me={2} disabled={isLoding} onClick={handleSubmit}>{isLoding ?
                        <Spinner/> : 'Save'}</Button>
                    <Button sx={{
                        textTransform: "capitalize",
                    }} variant="outline"
                            colorScheme="red" size="sm" onClick={() => {
                        formik.resetForm()
                        onClose()
                    }}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>)
}

export default AddMeeting

