const Job = require('../models/Job');

exports.getAllJobs = async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user._id });
  res.render('jobs', { jobs });
};

exports.getNewJobForm = (req, res) => {
  res.render('job', { job: null });
};

exports.createJob = async (req, res) => {
  const { company, position, status } = req.body;
  await Job.create({ company, position, status, createdBy: req.user._id });
  res.redirect('/jobs');
};

exports.getEditJobForm = async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    createdBy: req.user._id
  });
  res.render('job', { job });
};

exports.updateJob = async (req, res) => {
  const { company, position, status } = req.body;
  await Job.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    { company, position, status }
  );
  res.redirect('/jobs');
};

exports.deleteJob = async (req, res) => {
  await Job.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  res.redirect('/jobs');
};
